from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import Session

from catalog.routes import router as catalog_router
from catalog.seed import seed_catalog_if_empty
from core.config import get_settings
from core.database import engine, init_db
from core.logging import setup_logging


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
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.include_router(catalog_router)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
