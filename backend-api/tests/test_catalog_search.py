import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from catalog.seed import seed_catalog
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from main import app


@pytest.fixture()
def real_catalog_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "catalog_search.db"
    test_engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(test_engine)
    init_fts5(test_engine)

    with Session(test_engine) as session:
        seed_catalog(session)

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("CATALOG_STUB", "false")
    monkeypatch.setenv("CATALOG_AUTO_SEED", "false")
    get_settings.cache_clear()

    from core import database

    database.engine = test_engine
    database.settings = get_settings()

    def override_get_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    get_settings.cache_clear()
    for key in ("DATABASE_URL", "CATALOG_STUB", "CATALOG_AUTO_SEED"):
        os.environ.pop(key, None)


def test_search_by_language_canonical_aliases_return_same_set(real_catalog_client: TestClient) -> None:
    yoruba = real_catalog_client.get("/catalog/datasets/search", params={"language": "Yoruba"})
    yor = real_catalog_client.get("/catalog/datasets/search", params={"language": "yor"})
    yoruba_accent = real_catalog_client.get("/catalog/datasets/search", params={"language": "Yorùbá"})

    assert yoruba.status_code == 200
    assert yor.status_code == 200
    assert yoruba_accent.status_code == 200

    body_yoruba = yoruba.json()
    body_yor = yor.json()
    body_accent = yoruba_accent.json()

    assert body_yoruba["language_code"] == "yor"
    assert body_yor["language_code"] == "yor"
    assert body_accent["language_code"] == "yor"
    assert body_yoruba["total"] == 2
    assert body_yor["total"] == body_yoruba["total"]
    assert body_accent["total"] == body_yoruba["total"]

    ids_yoruba = {item["external_id"] for item in body_yoruba["datasets"]}
    ids_yor = {item["external_id"] for item in body_yor["datasets"]}
    ids_accent = {item["external_id"] for item in body_accent["datasets"]}
    assert ids_yoruba == ids_yor == ids_accent


def test_search_unknown_language_returns_empty_results(real_catalog_client: TestClient) -> None:
    response = real_catalog_client.get("/catalog/datasets/search", params={"language": "xyz-langue"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["language_code"] == "inconnu"
    assert body["datasets"] == []


def test_search_resolves_language_name_from_database(real_catalog_client: TestClient) -> None:
    response = real_catalog_client.get("/catalog/datasets/search", params={"language": "Swahili"})
    assert response.status_code == 200
    body = response.json()
    assert body["language_code"] == "swh"
    assert body["total"] == 1


def test_dataset_detail_via_catalog_api(real_catalog_client: TestClient) -> None:
    search = real_catalog_client.get("/catalog/datasets/search", params={"language": "wol"})
    dataset_id = search.json()["datasets"][0]["id"]

    detail = real_catalog_client.get(f"/catalog/datasets/{dataset_id}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["language"]["code"] == "wol"
    assert body["source_url"].startswith("https://")
