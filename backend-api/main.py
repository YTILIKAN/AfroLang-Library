import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import inspect, text
from sqlmodel import Session, select

from catalog.routes import PUBLIC_API_VERSION, catalog_router, public_router
from catalog.seed import seed_catalog
from catalog.afrilang_inventory import seed_afrilang_inventory
from accounts.routes import router as accounts_router
from accounts.seed import seed_admin_if_missing
from core.config import get_settings
from core.database import get_engine, get_session, init_db
from core.logging import get_logger, setup_logging
from core.models import Dataset, Provenance, Source
from ingestion.connectors.base import SourceConnector
from ingestion.connectors.huggingface import HuggingFaceConnector
from ingestion.connectors.kaggle import KaggleConnector
from ingestion.models import SyncLog
from ingestion.service import IngestionService

PUBLIC_API_DESCRIPTION = """
API publique **en lecture seule** de l'index AfroLang-Library (FR-15, AD-10).

- Métadonnées normalisées au format JSON
- Filtrage par langue et tâche NLP (vocabulaire contrôlé)
- Lien de redirection `source_url` sur chaque dataset
- Aucune opération d'écriture exposée

Surface stable : `/api/v1/*` — alias interne : `/catalog/*`
"""



def _connectors_to_run(
    session: Session, connectors: list[SourceConnector]
) -> list[SourceConnector]:
    """
    Ne retient que les connecteurs dont la source n'est pas déjà correctement peuplée.

    Une source est considérée comme faite seulement si elle réunit les deux conditions :
    une ingestion réussie tracée *et* des datasets synchronisés présents. Chacune prise
    isolément laisse passer un cas réel :

    - trace seule : le catalogue vidé (volume recréé, purge) ne se repeuplerait jamais ;
    - datasets seuls : le seed de démonstration écrit sous les mêmes sources, avec la même
      provenance `synchronisé`, et masquerait l'ingestion réelle sur une base vierge.

    La reprise est par source : une panne Kaggle (réseau, identifiants absents) est
    réessayée au démarrage suivant sans réingérer Hugging Face.
    """
    traced = set(
        session.exec(
            select(SyncLog.source_slug).where(SyncLog.success.is_(True)).distinct()
        ).all()
    )
    populated = set(
        session.exec(
            select(Source.slug)
            .join(Dataset, Dataset.source_id == Source.id)
            .where(Dataset.provenance == Provenance.SYNCHRONISE)
            .distinct()
        ).all()
    )
    done = traced & populated
    return [connector for connector in connectors if connector.source_slug not in done]


def _run_bootstrap_ingestion() -> None:
    """
    Peuple le catalogue au démarrage pour toute source encore vide — parité dev/prod.

    Déclenché par le démarrage du processus, jamais par une minuterie : conforme à AD-5
    (« pas de minuterie interne ni de processus toujours allumé »). L'ordonnancement
    périodique reste externe à l'application (cron, phase 2).

    Idempotent et repris par source : un démarrage sur un catalogue déjà peuplé ne
    déclenche aucun appel réseau, mais une source restée vide (échec réseau, identifiants
    Kaggle absents, arrêt en cours d'ingestion) est réessayée au démarrage suivant.
    """
    logger = get_logger(__name__)
    try:
        with Session(get_engine()) as session:
            connectors = _connectors_to_run(
                session, [HuggingFaceConnector(), KaggleConnector()]
            )
            if not connectors:
                logger.info("Catalogue déjà peuplé pour toutes les sources — démarrage sans ingestion")
                return

            logger.info(
                "Sources à peupler (%s) — ingestion initiale au démarrage",
                ", ".join(connector.source_slug for connector in connectors),
            )
            logs = IngestionService(session).run_all(connectors)
            # Les SyncLog sont expirés à la sortie du contexte : on fige le résumé ici,
            # sinon toute lecture d'attribut lèverait DetachedInstanceError.
            summaries = [
                (log.source_slug, log.success, log.added_count, log.removed_count, log.errors)
                for log in logs
            ]

        for source_slug, success, added_count, removed_count, errors in summaries:
            if success:
                logger.info(
                    "Ingestion initiale %s : %s ajout(s), %s retrait(s)",
                    source_slug,
                    added_count,
                    removed_count,
                )
            else:
                logger.error("Ingestion initiale %s en échec : %s", source_slug, errors)
    except Exception:
        logger.exception("Ingestion initiale interrompue — le service reste disponible")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = get_logger(__name__)
    setup_logging()
    try:
        init_db()
    except Exception:
        logger.exception("Impossible d'initialiser la base — arrêt du démarrage")
        raise
    settings = get_settings()
    try:
        if not settings.accounts_stub and settings.accounts_auto_seed:
            with Session(get_engine()) as session:
                if seed_admin_if_missing(session, settings):
                    logger.info("Compte admin initial créé (%s)", settings.admin_seed_email)
        if settings.catalog_auto_seed and not settings.catalog_stub:
            with Session(get_engine()) as session:
                inserted = seed_catalog(session)
                if inserted:
                    logger.info("Seed catalogue : %s nouveau(x) dataset(s)", inserted)
        if settings.afrilang_auto_seed and not settings.catalog_stub:
            with Session(get_engine()) as session:
                created, updated = seed_afrilang_inventory(session)
                session.commit()
                if created:
                    logger.info("Inventaire Afrilang : %s nouveau(x) dataset(s)", created)
                elif updated:
                    logger.info("Inventaire Afrilang : %s dataset(s) synchronisé(s)", updated)
    except Exception:
        logger.exception("Échec du seed au démarrage")
        raise

    # Détaché du démarrage : un catalogue vide ne doit jamais retarder le healthcheck
    # ni faire échouer un déploiement (Railway & co.).
    app.state.bootstrap_task = None
    if settings.catalog_bootstrap_ingest and not settings.catalog_stub:
        app.state.bootstrap_task = asyncio.create_task(
            asyncio.to_thread(_run_bootstrap_ingestion)
        )

    yield

    # Un thread lancé par `to_thread` n'est pas annulable et retient de toute façon la
    # sortie de l'interpréteur : l'attendre explicitement remplace un « Task was destroyed
    # but it is pending » silencieux par un arrêt tracé. Si la plateforme coupe avant la
    # fin, les sources restées vides sont reprises au démarrage suivant.
    task = app.state.bootstrap_task
    if task is not None and not task.done():
        logger.info("Ingestion initiale encore en cours — attente avant l'arrêt")
    if task is not None:
        try:
            await task
        except asyncio.CancelledError:
            logger.warning("Ingestion initiale annulée à l'arrêt")
        except Exception:
            logger.exception("Ingestion initiale terminée en erreur")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="AfroLang-Library Public API",
        version=PUBLIC_API_VERSION,
        description=PUBLIC_API_DESCRIPTION,
        lifespan=lifespan,
        openapi_tags=[
            {
                "name": "public-api",
                "description": "API publique v1 — consultation de l'index (lecture seule).",
            },
            {
                "name": "catalog",
                "description": "Alias interne des routes public-api sous `/catalog`.",
            },
            {"name": "health", "description": "Santé du service."},
            {
                "name": "accounts",
                "description": "Comptes, authentification et surface d'écriture authentifiée (FR-16).",
            },
        ],
    )
    app.include_router(public_router, prefix="/api/v1")
    app.include_router(catalog_router, prefix="/catalog")
    app.include_router(accounts_router)

    cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    if cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/db", tags=["health"])
    def health_db(session: Session = Depends(get_session)) -> dict[str, str]:
        try:
            bind = session.bind
            if bind is None:
                raise RuntimeError("Session sans moteur SQL")
            session.connection().execute(text("SELECT 1"))
            tables = set(inspect(bind).get_table_names())
            missing = {"account", "dataset"} - tables
            if missing:
                raise RuntimeError(f"Tables manquantes : {sorted(missing)}")
            return {"status": "ok", "database": "connected", "tables": str(len(tables))}
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Base indisponible : {exc}",
            ) from exc

    return app


app = create_app()
