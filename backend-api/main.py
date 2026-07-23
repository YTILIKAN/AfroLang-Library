from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import Session

from catalog.routes import PUBLIC_API_VERSION, catalog_router, public_router
from catalog.seed import seed_catalog_if_empty
from accounts.routes import router as accounts_router
from core.config import get_settings
from core.database import engine, init_db
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
    if settings.catalog_auto_seed and not settings.catalog_stub:
        with Session(engine) as session:
            seed_catalog_if_empty(session)
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

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
