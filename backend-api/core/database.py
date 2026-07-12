from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from core.config import get_settings
from core import models  # noqa: F401 — enregistre les tables partagées
from core.fts import init_fts5

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    init_fts5(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
