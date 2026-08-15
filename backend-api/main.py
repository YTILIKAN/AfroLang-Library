from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import inspect, text
from sqlmodel import Session

from catalog.routes import PUBLIC_API_VERSION, catalog_router, public_router
from catalog.seed import seed_catalog
from accounts.routes import router as accounts_router
from accounts.seed import seed_admin_if_missing
from core.config import get_settings
from core.database import get_engine, get_session, init_db
from core.logging import get_logger, setup_logging

PUBLIC_API_DESCRIPTION = """
API publique **en lecture seule** de l'index AfroLang-Library (FR-15, AD-10).

- Métadonnées normalisées au format JSON
- Filtrage par langue et tâche NLP (vocabulaire contrôlé)
- Lien de redirection `source_url` sur chaque dataset
- Aucune opération d'écriture exposée

Surface stable : `/api/v1/*` — alias interne : `/catalog/*`
"""


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
    except Exception:
        logger.exception("Échec du seed au démarrage")
        raise
    yield


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
