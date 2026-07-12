import pytest

from core.models import UNKNOWN
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.normalization import normalize_dataset_metadata
from ingestion.normalization.tasks import normalize_task_tags
from ingestion.normalization.vocabulary import get_task_label


@pytest.mark.parametrize(
    ("raw_tag", "expected_code"),
    [
        ("automatic-speech-recognition", "asr"),
        ("ASR", "asr"),
        ("machine-translation", "nmt"),
        ("traduction", "nmt"),
        ("text-classification", "classification"),
        ("NER", "ner"),
        ("text-to-speech", "tts"),
        ("summarization", "summarization"),
    ],
)
def test_task_tags_map_to_controlled_vocabulary(raw_tag: str, expected_code: str) -> None:
    codes, unmapped = normalize_task_tags([raw_tag])
    assert codes == [expected_code]
    assert unmapped == []
    assert get_task_label(expected_code) != UNKNOWN


def test_unmapped_task_tag_is_flagged_for_review() -> None:
    codes, unmapped = normalize_task_tags(["custom-unknown-task"])
    assert codes == ["inconnu"]
    assert unmapped == ["custom-unknown-task"]


def test_empty_task_tags_default_to_inconnu() -> None:
    codes, unmapped = normalize_task_tags([])
    assert codes == ["inconnu"]
    assert unmapped == []


def test_multiple_raw_tags_deduplicate_to_controlled_vocabulary() -> None:
    codes, unmapped = normalize_task_tags(["asr", "automatic-speech-recognition", "speech-to-text"])
    assert codes == ["asr"]
    assert unmapped == []


def test_missing_metadata_marked_inconnu_and_dataset_kept() -> None:
    raw = RawDatasetMetadata(
        external_id="hf/minimal-dataset",
        title="Dataset minimal",
        source_slug="huggingface",
        source_url="https://huggingface.co/datasets/hf/minimal-dataset",
        language_raw=None,
        task_tags_raw=[],
        description_raw=None,
        license_raw=None,
        data_format_raw=None,
        size_raw=None,
    )

    result = normalize_dataset_metadata(raw)

    assert result.dataset.title == "Dataset minimal"
    assert result.dataset.description == UNKNOWN
    assert result.dataset.license is not None
    assert result.dataset.license.name == UNKNOWN
    assert result.dataset.data_format == UNKNOWN
    assert result.dataset.size == UNKNOWN
    assert result.dataset.language_raw == UNKNOWN
    assert result.dataset.task_codes == ["inconnu"]
    assert result.dataset.task_tags_raw == UNKNOWN


def test_partial_metadata_preserved_and_tasks_normalized() -> None:
    raw = RawDatasetMetadata(
        external_id="kaggle/swahili-news",
        title="Swahili News",
        source_slug="kaggle",
        source_url="https://www.kaggle.com/datasets/swahili-news",
        language_raw="swahili",
        task_tags_raw=["text-classification", "unknown-tag"],
        description_raw="Articles annotés",
        license_raw="CC0",
        data_format_raw="csv",
        size_raw=None,
    )

    result = normalize_dataset_metadata(raw, language_code="swh", language_name="Swahili")

    assert result.dataset.task_codes == ["classification"]
    assert result.dataset.task_tags_raw == "text-classification, unknown-tag"
    assert result.dataset.size == UNKNOWN
    assert result.dataset.license.name == "CC0"
    assert result.unmapped_task_tags == ["unknown-tag"]
    assert any("revue" in warning for warning in result.warnings)


def test_normalization_end_to_end_persistence(session_factory) -> None:
    """Le dataset normalisé est persistable même avec métadonnées partielles."""
    from pathlib import Path

    from sqlmodel import Session, SQLModel, create_engine

    from catalog.service import CatalogService
    from core import models  # noqa: F401
    from core.fts import init_fts5
    from ingestion.service import IngestionService

    db_path = Path(session_factory)
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    init_fts5(engine)

    raw = RawDatasetMetadata(
        external_id="hf/wolof-tts",
        title="Wolof TTS samples",
        source_slug="huggingface",
        source_url="https://huggingface.co/datasets/hf/wolof-tts",
        language_raw="Wolof",
        task_tags_raw=["text-to-speech"],
        license_raw=None,
    )

    with Session(engine) as session:
        service = IngestionService(session)
        normalized = service.normalize_raw_dataset(raw, language_code="wol", language_name="Wolof")
        saved = service.persist_dataset(normalized.dataset)

    assert saved.tasks[0].code == "tts"
    assert saved.license.name == UNKNOWN
    assert saved.task_tags_raw == "text-to-speech"

    with Session(engine) as session:
        datasets = CatalogService(session).list_datasets_for_language("wol")
    assert len(datasets) == 1
    engine.dispose()


@pytest.fixture()
def session_factory(tmp_path):
    return tmp_path / "norm.db"
