from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine

from core.fts import init_fts5
from core.models import Language
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.normalization import resolve_language_for_ingestion
from ingestion.normalization.language import UNRESOLVED_LANGUAGE_CODE
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
    engine = _create_engine(tmp_path / "language.db")
    with Session(engine) as db_session:
        yield db_session
    engine.dispose()


def test_known_iso_639_1_alias_resolves_to_canonical_code(session: Session) -> None:
    resolution = resolve_language_for_ingestion("yo", session)
    assert resolution.code == "yor"
    assert resolution.matched is True


def test_list_of_raw_values_resolves_on_first_match(session: Session) -> None:
    resolution = resolve_language_for_ingestion(["Yorùbá", "yor"], session)
    assert resolution.code == "yor"
    assert resolution.matched is True


def test_unmapped_language_falls_back_to_und(session: Session) -> None:
    resolution = resolve_language_for_ingestion("klingon-imaginary", session)
    assert resolution.code == UNRESOLVED_LANGUAGE_CODE
    assert resolution.matched is False


def test_none_language_falls_back_to_und(session: Session) -> None:
    resolution = resolve_language_for_ingestion(None, session)
    assert resolution.code == UNRESOLVED_LANGUAGE_CODE
    assert resolution.matched is False


def test_resolution_falls_back_to_language_table_by_code(session: Session) -> None:
    session.add(Language(code="lug", name="Luganda"))
    session.commit()

    resolution = resolve_language_for_ingestion("lug", session)
    assert resolution.code == "lug"
    assert resolution.matched is True


def test_normalize_and_prepare_resolves_language_from_raw(session: Session) -> None:
    raw = RawDatasetMetadata(
        external_id="org/yoruba-asr",
        title="Yoruba ASR",
        source_slug="huggingface",
        source_url="https://huggingface.co/datasets/org/yoruba-asr",
        language_raw=["yo"],
        task_tags_raw=["automatic-speech-recognition"],
    )

    service = IngestionService(session)
    result = service.normalize_and_prepare(raw)

    assert result.dataset.language.code == "yor"
    assert not any("non mappable" in warning for warning in result.warnings)


def test_normalize_and_prepare_flags_unmappable_language(session: Session) -> None:
    raw = RawDatasetMetadata(
        external_id="org/mystery-lang",
        title="Mystery language dataset",
        source_slug="huggingface",
        source_url="https://huggingface.co/datasets/org/mystery-lang",
        language_raw="klingon-imaginary",
        task_tags_raw=[],
    )

    service = IngestionService(session)
    result = service.normalize_and_prepare(raw)

    assert result.dataset.language.code == UNRESOLVED_LANGUAGE_CODE
    assert any("non mappable" in warning for warning in result.warnings)
    assert result.needs_review is True
