import httpx
import pytest

from ingestion.connectors.huggingface import HuggingFaceConnector

_SAMPLE_ENTRY = {
    "id": "org/yoruba-asr-corpus",
    "cardData": {
        "language": ["yo"],
        "license": "cc-by-4.0",
    },
    "tags": [
        "language:yo",
        "task_categories:automatic-speech-recognition",
        "license:cc-by-4.0",
        "size_categories:1K<n<10K",
        "region:us",
    ],
    "description": "Corpus ASR en yoruba",
}


class _FakeResponse:
    def __init__(self, payload: list[dict]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> list[dict]:
        return self._payload


def test_fetch_raw_datasets_maps_and_dedupes(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url, params=None, timeout=None):
        return _FakeResponse([_SAMPLE_ENTRY])

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = HuggingFaceConnector()
    raw_datasets = connector.fetch_raw_datasets()

    assert len(raw_datasets) == 1
    dataset = raw_datasets[0]
    assert dataset.external_id == "org/yoruba-asr-corpus"
    assert dataset.title == "org/yoruba-asr-corpus"
    assert dataset.source_slug == "huggingface"
    assert dataset.source_url == "https://huggingface.co/datasets/org/yoruba-asr-corpus"
    assert dataset.language_raw == ["yo"]
    assert dataset.task_tags_raw == ["automatic-speech-recognition"]
    assert dataset.license_raw == "cc-by-4.0"
    assert dataset.size_raw == "1K<n<10K"
    assert dataset.description_raw == "Corpus ASR en yoruba"


def test_fetch_raw_datasets_joins_multi_value_license(monkeypatch: pytest.MonkeyPatch) -> None:
    entry = {
        "id": "org/multi-license-dataset",
        "cardData": {"language": ["ha"], "license": ["cc-by-sa-3.0", "gfdl"]},
        "tags": ["language:ha"],
        "description": None,
    }

    def fake_get(url, params=None, timeout=None):
        return _FakeResponse([entry])

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = HuggingFaceConnector()
    raw_datasets = connector.fetch_raw_datasets()

    assert len(raw_datasets) == 1
    assert raw_datasets[0].license_raw == "cc-by-sa-3.0, gfdl"


def test_connector_never_imports_persistence_layer() -> None:
    import ingestion.connectors.huggingface as module

    source = module.__file__
    with open(source, encoding="utf-8") as handle:
        content = handle.read()

    for forbidden in ("sqlmodel", "Session", "IngestionRepository", "core.database"):
        assert forbidden not in content


def test_run_captures_network_failure_without_raising(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url, params=None, timeout=None):
        raise httpx.ConnectTimeout("API Hugging Face indisponible")

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = HuggingFaceConnector()
    result = connector.run()

    assert result.success is False
    assert result.source_slug == "huggingface"
    assert any("indisponible" in error for error in result.errors)
