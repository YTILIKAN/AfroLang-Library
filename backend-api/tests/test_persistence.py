from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine

from catalog.service import CatalogService
from core import models  # noqa: F401
from core.fts import init_fts5
from core.models import Dataset, Provenance
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
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
    engine = _create_engine(tmp_path / "test.db")
    with Session(engine) as db_session:
        yield db_session
    engine.dispose()


def _sample_dataset() -> DatasetInput:
    return DatasetInput(
        external_id="yoruba-asr-corpus",
        title="Yoruba ASR Corpus",
        source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
        language=LanguageInput(code="yor", name="Yoruba", family="Niger-Congo", region="West Africa"),
        language_raw="Yorùbá",
        provenance=Provenance.SYNCHRONISE,
        source_url="https://huggingface.co/datasets/yoruba-asr-corpus",
        description="Corpus de reconnaissance vocale en yoruba",
        license=LicenseInput(name="CC BY 4.0", spdx_id="CC-BY-4.0", url="https://creativecommons.org/licenses/by/4.0/"),
        data_format="audio",
        size="2.5 GB",
        task_codes=["asr"],
        task_tags_raw="automatic-speech-recognition",
    )


def test_shared_entities_and_relationships(session: Session) -> None:
    ingestion = IngestionService(session)
    catalog = CatalogService(session)

    saved = ingestion.persist_dataset(_sample_dataset())

    assert saved.id is not None
    assert saved.source is not None
    assert saved.language is not None
    assert saved.license is not None
    assert len(saved.tasks) == 1
    assert saved.tasks[0].code == "asr"
    assert saved.provenance == Provenance.SYNCHRONISE
    assert saved.source_url.startswith("https://")
    assert saved.language_raw == "Yorùbá"

    by_language = catalog.list_datasets_for_language("yor")
    assert len(by_language) == 1
    assert by_language[0].title == "Yoruba ASR Corpus"


def test_persistence_survives_restart(tmp_path: Path) -> None:
    db_path = tmp_path / "restart.db"
    engine = _create_engine(db_path)

    with Session(engine) as session:
        IngestionService(session).persist_dataset(_sample_dataset())
    engine.dispose()

    restarted_engine = _create_engine(db_path)
    with Session(restarted_engine) as session:
        datasets = CatalogService(session).list_datasets_for_language("yor")

    assert len(datasets) == 1
    assert datasets[0].external_id == "yoruba-asr-corpus"
    restarted_engine.dispose()


def test_storage_contains_metadata_only(session: Session) -> None:
    dataset = IngestionService(session).persist_dataset(_sample_dataset())

    allowed_fields = {
        "id",
        "external_id",
        "title",
        "description",
        "source_id",
        "language_code",
        "language_raw",
        "task_tags_raw",
        "license_id",
        "provenance",
        "contributor_account_id",
        "data_format",
        "size",
        "source_url",
        "published_at",
        "created_at",
        "updated_at",
    }
    assert set(Dataset.model_fields.keys()) == allowed_fields
    payload = dataset.model_dump()
    assert "content" not in payload
    assert "file_data" not in payload


def test_fts5_search(session: Session) -> None:
    ingestion = IngestionService(session)
    catalog = CatalogService(session)

    ingestion.persist_dataset(_sample_dataset())

    results = catalog.search_datasets("yoruba")
    assert len(results) == 1
    assert results[0].language_code == "yor"
