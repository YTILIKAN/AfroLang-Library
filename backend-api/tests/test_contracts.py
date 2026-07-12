import pytest
from fastapi.testclient import TestClient

from ingestion.connectors import RawDatasetMetadata
from ingestion.connectors.base import SourceConnector
from main import app


client = TestClient(app)


class _FakeConnector(SourceConnector):
    @property
    def source_slug(self) -> str:
        return "test-source"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        return [
            RawDatasetMetadata(
                external_id="ds-1",
                title="Test",
                source_slug="test-source",
                source_url="https://example.com/ds-1",
                language_raw="yoruba",
            )
        ]


def test_connector_contract_produces_intermediate_structure() -> None:
    connector = _FakeConnector()
    result = connector.run()

    assert result.source_slug == "test-source"
    assert result.success
    assert len(result.datasets) == 1
    assert result.datasets[0].external_id == "ds-1"
    assert isinstance(result.datasets[0], RawDatasetMetadata)


def test_connector_contract_captures_errors() -> None:
    class _BrokenConnector(SourceConnector):
        @property
        def source_slug(self) -> str:
            return "broken"

        def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
            raise RuntimeError("API indisponible")

    result = _BrokenConnector().run()
    assert not result.success
    assert "API indisponible" in result.errors[0]


def test_stub_search_by_language_aliases() -> None:
    yoruba = client.get("/catalog/datasets/search", params={"language": "Yoruba"})
    yor = client.get("/catalog/datasets/search", params={"language": "yor"})
    yoruba_accent = client.get("/catalog/datasets/search", params={"language": "Yorùbá"})

    assert yoruba.status_code == 200
    assert yor.status_code == 200
    assert yoruba_accent.status_code == 200

    body_yoruba = yoruba.json()
    body_yor = yor.json()
    body_accent = yoruba_accent.json()

    assert body_yoruba["language_code"] == "yor"
    assert body_yor["language_code"] == body_yoruba["language_code"]
    assert body_accent["language_code"] == body_yoruba["language_code"]
    assert body_yoruba["total"] >= 1
    assert body_yoruba["datasets"][0]["source_url"].startswith("https://")


def test_stub_dataset_detail() -> None:
    response = client.get("/catalog/datasets/1")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["language"]["code"] == "yor"
    assert "created_at" in body
    assert "content" not in body


def test_stub_dataset_not_found() -> None:
    response = client.get("/catalog/datasets/9999")
    assert response.status_code == 404
