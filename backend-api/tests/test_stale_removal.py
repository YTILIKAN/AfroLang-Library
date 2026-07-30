from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from core.fts import init_fts5
from core.models import Dataset, Provenance
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.repository import IngestionRepository
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
    engine = _create_engine(tmp_path / "stale.db")
    with Session(engine) as db_session:
        yield db_session
    engine.dispose()


def _seed_payload(external_id: str, provenance: Provenance) -> DatasetInput:
    return DatasetInput(
        external_id=external_id,
        title=f"Dataset {external_id}",
        source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
        language=LanguageInput(code="yor", name="Yoruba", family="Niger-Congo", region="West Africa"),
        language_raw="Yorùbá",
        provenance=provenance,
        source_url=f"https://huggingface.co/datasets/{external_id}",
        license=LicenseInput(name="CC BY 4.0"),
        task_codes=["asr"],
        task_tags_raw="automatic-speech-recognition",
    )


def _raw(external_id: str) -> RawDatasetMetadata:
    return RawDatasetMetadata(
        external_id=external_id,
        title=f"Dataset {external_id}",
        source_slug="huggingface",
        source_url=f"https://huggingface.co/datasets/{external_id}",
        language_raw="yo",
        task_tags_raw=["automatic-speech-recognition"],
    )


def test_synced_dataset_absent_from_fetch_is_removed(session: Session) -> None:
    repository = IngestionRepository(session)
    repository.save_dataset(_seed_payload("hf/ds-1", Provenance.SYNCHRONISE))
    repository.save_dataset(_seed_payload("hf/ds-2", Provenance.SYNCHRONISE))

    outcome = IngestionService(session).ingest_source("huggingface", [_raw("hf/ds-1")])

    remaining = {d.external_id for d in session.exec(select(Dataset)).all()}
    assert remaining == {"hf/ds-1"}
    assert len(outcome.removed) == 1
    assert len(outcome.added) == 1


def test_contributed_dataset_is_never_removed_even_if_absent_from_fetch(session: Session) -> None:
    repository = IngestionRepository(session)
    repository.save_dataset(_seed_payload("hf/synced-gone", Provenance.SYNCHRONISE))
    repository.save_dataset(_seed_payload("hf/contributed-stays", Provenance.CONTRIBUE))

    outcome = IngestionService(session).ingest_source("huggingface", [])

    remaining = {d.external_id for d in session.exec(select(Dataset)).all()}
    assert remaining == {"hf/contributed-stays"}
    assert len(outcome.removed) == 1
    assert outcome.added == []


def test_manual_dataset_is_never_removed(session: Session) -> None:
    repository = IngestionRepository(session)
    repository.save_dataset(_seed_payload("hf/manual-entry", Provenance.MANUEL))

    outcome = IngestionService(session).ingest_source("huggingface", [])

    remaining = {d.external_id for d in session.exec(select(Dataset)).all()}
    assert remaining == {"hf/manual-entry"}
    assert outcome.removed == []


def test_removal_and_addition_happen_in_the_same_transaction(session: Session) -> None:
    """Un batch qui ajoute ET retire ne doit produire qu'un seul commit (AD-11)."""
    repository = IngestionRepository(session)
    repository.save_dataset(_seed_payload("hf/old", Provenance.SYNCHRONISE))

    commit_calls = 0
    original_commit = session.commit

    def counting_commit():
        nonlocal commit_calls
        commit_calls += 1
        return original_commit()

    session.commit = counting_commit  # type: ignore[method-assign]

    IngestionService(session).ingest_source("huggingface", [_raw("hf/new")])

    assert commit_calls == 1
    remaining = {d.external_id for d in session.exec(select(Dataset)).all()}
    assert remaining == {"hf/new"}
