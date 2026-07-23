from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from core import models as core_models  # noqa: F401
from core.fts import init_fts5
from ingestion import models as ingestion_models  # noqa: F401
from ingestion.connectors.base import SourceConnector
from ingestion.connectors.schemas import ConnectorFetchResult, RawDatasetMetadata
from ingestion.models import SyncLog
from ingestion.service import IngestionService


def _create_engine(db_path: Path):
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    init_fts5(engine)
    return engine


@pytest.fixture()
def session(tmp_path: Path):
    engine = _create_engine(tmp_path / "scheduler.db")
    with Session(engine) as db_session:
        yield db_session
    engine.dispose()


class _WorkingConnector(SourceConnector):
    @property
    def source_slug(self) -> str:
        return "working-source"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        return [
            RawDatasetMetadata(
                external_id="ds-1",
                title="Dataset 1",
                source_slug="working-source",
                source_url="https://example.com/ds-1",
                language_raw="yo",
                task_tags_raw=["automatic-speech-recognition"],
            )
        ]


class _BrokenConnector(SourceConnector):
    @property
    def source_slug(self) -> str:
        return "broken-source"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        raise RuntimeError("API indisponible")


class _CrashingConnector(SourceConnector):
    """Simule un bug inattendu qui échappe même à la protection interne de run()."""

    @property
    def source_slug(self) -> str:
        return "crashing-source"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        return []

    def run(self) -> ConnectorFetchResult:
        raise ValueError("bug totalement inattendu")


def test_run_for_connector_records_success(session: Session) -> None:
    log = IngestionService(session).run_for_connector(_WorkingConnector())

    assert log.success is True
    assert log.source_slug == "working-source"
    assert log.added_count == 1
    assert log.removed_count == 0
    assert log.id is not None


def test_run_for_connector_records_connector_failure_without_touching_data(session: Session) -> None:
    log = IngestionService(session).run_for_connector(_BrokenConnector())

    assert log.success is False
    assert "API indisponible" in log.errors
    assert log.added_count == 0


def test_run_all_isolates_failures_between_connectors(session: Session) -> None:
    logs = IngestionService(session).run_all([_WorkingConnector(), _BrokenConnector()])

    by_source = {log.source_slug: log for log in logs}
    assert by_source["working-source"].success is True
    assert by_source["working-source"].added_count == 1
    assert by_source["broken-source"].success is False


def test_run_all_survives_a_connector_crashing_outside_its_own_protection(session: Session) -> None:
    logs = IngestionService(session).run_all([_CrashingConnector(), _WorkingConnector()])

    by_source = {log.source_slug: log for log in logs}
    assert by_source["crashing-source"].success is False
    assert "bug totalement inattendu" in by_source["crashing-source"].errors
    assert by_source["working-source"].success is True


def test_sync_log_rows_are_queryable(session: Session) -> None:
    IngestionService(session).run_for_connector(_WorkingConnector())

    logs = session.exec(select(SyncLog)).all()
    assert len(logs) == 1
