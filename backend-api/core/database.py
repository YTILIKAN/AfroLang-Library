from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

engine: Engine | None = None

REQUIRED_TABLES = frozenset(
    {
        "account",
        "account_session",
        "dataset",
        "language",
        "source",
        "license",
        "task",
        "dataset_task_link",
    }
)


def _load_all_models() -> None:
    import core.models  # noqa: F401 — tables partagées
    import accounts.models  # noqa: F401 — sessions auth
    import ingestion.models  # noqa: F401 — journaux sync


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


def reset_engine() -> None:
    """Réinitialise le moteur (tests ou changement d'URL)."""
    global engine
    if engine is not None:
        engine.dispose()
    engine = None


def _verify_tables(db_engine: Engine) -> None:
    inspector = inspect(db_engine)
    existing = set(inspector.get_table_names())
    missing = REQUIRED_TABLES - existing
    if missing:
        raise RuntimeError(
            f"Tables manquantes après init_db : {sorted(missing)}. "
            f"Tables présentes : {sorted(existing)}"
        )


def init_db() -> None:
    from core.fts import init_fts5

    _load_all_models()
    db_engine = get_engine()
    safe_url = db_engine.url.render_as_string(hide_password=True)
    logger.info("Initialisation PostgreSQL/SQLite : %s", safe_url)

    SQLModel.metadata.create_all(db_engine)
    init_fts5(db_engine)
    _verify_tables(db_engine)

    with db_engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        connection.commit()

    logger.info("Base prête (%d tables)", len(inspect(db_engine).get_table_names()))


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
