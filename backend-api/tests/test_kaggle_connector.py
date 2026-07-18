import httpx
import pytest

from core.config import Settings, get_settings
import ingestion.connectors.kaggle as kaggle_module
from ingestion.connectors.kaggle import KaggleConnector

_SAMPLE_ENTRY = {
    "ref": "someuser/yoruba-news-dataset",
    "title": "Yoruba News Dataset",
    "url": "https://www.kaggle.com/datasets/someuser/yoruba-news-dataset",
    "licenseName": "CC0 1.0",
    # L'API Kaggle réelle renvoie les tags comme des objets, pas des chaînes.
    "tags": [
        {"nameNullable": "nlp", "fullPath": "nlp", "datasetCount": 100, "totalCount": 100},
        {"nameNullable": "text-classification", "fullPath": "text-classification", "totalCount": 50},
    ],
    "datasetSize": 2048,
}


class _FakeResponse:
    def __init__(self, payload: list[dict]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> list[dict]:
        return self._payload


@pytest.fixture()
def kaggle_credentials(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("KAGGLE_USERNAME", "test-user")
    monkeypatch.setenv("KAGGLE_KEY", "test-key")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    monkeypatch.delenv("KAGGLE_USERNAME", raising=False)
    monkeypatch.delenv("KAGGLE_KEY", raising=False)


def test_missing_credentials_is_captured_as_visible_error(monkeypatch: pytest.MonkeyPatch) -> None:
    # Indépendant de tout .env local : force explicitement l'absence de credentials.
    monkeypatch.setattr(
        kaggle_module,
        "get_settings",
        lambda: Settings(kaggle_username=None, kaggle_key=None),
    )

    connector = KaggleConnector()
    result = connector.run()

    assert result.success is False
    assert result.source_slug == "kaggle"
    assert any("Identifiants Kaggle absents" in error for error in result.errors)


def test_fetch_raw_datasets_maps_and_dedupes(kaggle_credentials, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url, params=None, auth=None, timeout=None):
        assert auth == ("test-user", "test-key")
        return _FakeResponse([_SAMPLE_ENTRY])

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = KaggleConnector()
    raw_datasets = connector.fetch_raw_datasets()

    assert len(raw_datasets) == 1
    dataset = raw_datasets[0]
    assert dataset.external_id == "someuser/yoruba-news-dataset"
    assert dataset.title == "Yoruba News Dataset"
    assert dataset.source_slug == "kaggle"
    assert dataset.source_url == "https://www.kaggle.com/datasets/someuser/yoruba-news-dataset"
    assert dataset.language_raw == "yoruba"
    assert dataset.task_tags_raw == ["nlp", "text-classification"]
    assert dataset.license_raw == "CC0 1.0"
    assert dataset.size_raw == "2048"


def test_fetch_raw_datasets_handles_mixed_string_and_object_tags(
    kaggle_credentials, monkeypatch: pytest.MonkeyPatch
) -> None:
    entry = {
        **_SAMPLE_ENTRY,
        "ref": "someuser/mixed-tags-dataset",
        "tags": ["plain-string-tag", {"nameNullable": "africa"}, {"name": "language"}, {}],
    }

    def fake_get(url, params=None, auth=None, timeout=None):
        return _FakeResponse([entry])

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = KaggleConnector()
    raw_datasets = connector.fetch_raw_datasets()

    assert len(raw_datasets) == 1
    assert raw_datasets[0].task_tags_raw == ["plain-string-tag", "africa", "language"]


def test_run_captures_network_failure_without_raising(kaggle_credentials, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url, params=None, auth=None, timeout=None):
        raise httpx.ConnectTimeout("API Kaggle indisponible")

    monkeypatch.setattr(httpx, "get", fake_get)

    connector = KaggleConnector()
    result = connector.run()

    assert result.success is False
    assert result.source_slug == "kaggle"
    assert any("indisponible" in error for error in result.errors)
