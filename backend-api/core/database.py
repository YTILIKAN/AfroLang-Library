from collections.abc import Generator

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from core.config import get_settings
from core import models  # noqa: F401 — enregistre les tables partagées
import accounts.models  # noqa: F401 — tables privées accounts
from core.fts import init_fts5

engine: Engine | None = None


def _build_engine(database_url: str) -> Engine:
    kwargs: dict = {}
    if database_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    else:
        kwargs["pool_pre_ping"] = True
    return create_engine(database_url, **kwargs)


def get_engine() -> Engine:
    global engine
    if engine is None:
        engine = _build_engine(get_settings().database_url)
    return engine


def init_db() -> None:
    db_engine = get_engine()
    SQLModel.metadata.create_all(db_engine)
    init_fts5(db_engine)


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
