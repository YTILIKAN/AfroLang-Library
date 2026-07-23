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
def catalog_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "catalog_language.db"
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


@pytest.fixture()
def stub_catalog(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CATALOG_STUB", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    monkeypatch.delenv("CATALOG_STUB", raising=False)


def test_language_overview_returns_datasets_and_stats(catalog_client: TestClient) -> None:
    response = catalog_client.get("/catalog/languages/overview", params={"language": "Yoruba"})
    assert response.status_code == 200
    body = response.json()

    assert body["language_code"] == "yor"
    assert body["language"]["name"] == "Yoruba"
    assert body["stats"]["dataset_count"] == 2
    assert body["stats"]["task_count"] == 2
    assert {task["code"] for task in body["stats"]["tasks_covered"]} == {"asr", "classification"}
    assert len(body["datasets"]) == 2


def test_language_overview_aliases_return_same_aggregation(catalog_client: TestClient) -> None:
    yoruba = catalog_client.get("/catalog/languages/overview", params={"language": "Yoruba"})
    yor = catalog_client.get("/catalog/languages/overview", params={"language": "yor"})
    accent = catalog_client.get("/catalog/languages/overview", params={"language": "Yorùbá"})

    assert yoruba.json()["stats"] == yor.json()["stats"] == accent.json()["stats"]
    assert len(yoruba.json()["datasets"]) == 2


def test_language_overview_swahili_stats(catalog_client: TestClient) -> None:
    response = catalog_client.get("/catalog/languages/overview", params={"language": "Swahili"})
    assert response.status_code == 200
    body = response.json()

    assert body["language_code"] == "swh"
    assert body["stats"]["dataset_count"] == 1
    assert body["stats"]["task_count"] == 1
    assert body["stats"]["tasks_covered"][0]["code"] == "classification"


def test_language_overview_unknown_language(catalog_client: TestClient) -> None:
    response = catalog_client.get("/catalog/languages/overview", params={"language": "unknown-lang"})
    assert response.status_code == 200
    body = response.json()
    assert body["language_code"] == "inconnu"
    assert body["language"] is None
    assert body["stats"]["dataset_count"] == 0


def test_stub_language_overview_contract(stub_catalog) -> None:
    client = TestClient(app)
    response = client.get("/catalog/languages/overview", params={"language": "yor"})
    assert response.status_code == 200
    body = response.json()
    assert body["language_code"] == "yor"
    assert body["stats"]["dataset_count"] >= 1
    assert "tasks_covered" in body["stats"]
