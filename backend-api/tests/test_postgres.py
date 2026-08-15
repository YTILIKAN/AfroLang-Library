import pytest
from sqlmodel import Session, SQLModel, create_engine

from catalog.service import CatalogService
from core import models  # noqa: F401
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
from core.models import Provenance
from core.search import search_datasets
from ingestion.service import IngestionService


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


@pytest.fixture()
def postgres_session():
    engine = create_engine(
        "postgresql+psycopg2://postgres:postgres@localhost:5432/afriland_test",
        pool_pre_ping=True,
    )
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.mark.integration
def test_postgres_ilike_search(postgres_session: Session) -> None:
    ingestion = IngestionService(postgres_session)
    ingestion.persist_dataset(_sample_dataset())

    results = search_datasets(postgres_session, "yoruba")
    assert len(results) == 1
    assert results[0].language_code == "yor"

    by_language = CatalogService(postgres_session).list_datasets_for_language("yor")
    assert len(by_language) == 1
