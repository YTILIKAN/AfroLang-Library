from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from catalog.routes import PUBLIC_API_VERSION, catalog_router, public_router
from catalog.seed import seed_catalog
from accounts.routes import router as accounts_router
from accounts.seed import seed_admin_if_missing
from core.config import get_settings
from core.database import get_engine, init_db
from core.logging import setup_logging

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
    setup_logging()
    init_db()
    settings = get_settings()
    if not settings.accounts_stub and settings.accounts_auto_seed:
        with Session(get_engine()) as session:
            seed_admin_if_missing(session, settings)
    if settings.catalog_auto_seed and not settings.catalog_stub:
        with Session(get_engine()) as session:
            inserted = seed_catalog(session)
            if inserted:
                from core.logging import get_logger

                get_logger(__name__).info("Seed catalogue : %s dataset(s) synchronisé(s)", inserted)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="AfroLang-Library Public API",
        version=PUBLIC_API_VERSION,
        description=PUBLIC_API_DESCRIPTION,
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

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
