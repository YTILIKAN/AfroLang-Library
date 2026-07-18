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
def public_api_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "public_api.db"
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


def test_public_api_manifest(public_api_client: TestClient) -> None:
    response = public_api_client.get("/api/v1")
    assert response.status_code == 200
    body = response.json()
    assert body["read_only"] is True
    assert body["version"] == "1.0.0"
    assert any(endpoint["path"] == "/api/v1/datasets/filter" for endpoint in body["endpoints"])


def test_public_api_filter_by_language_and_task(public_api_client: TestClient) -> None:
    response = public_api_client.get(
        "/api/v1/datasets/filter",
        params={"language": "yor", "task": "asr"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["filters"]["language_code"] == "yor"
    assert body["filters"]["task_code"] == "asr"


def test_public_api_datasets_include_source_url(public_api_client: TestClient) -> None:
    response = public_api_client.get("/api/v1/datasets/search", params={"language": "yor"})
    assert response.status_code == 200
    for dataset in response.json()["datasets"]:
        assert dataset["source_url"].startswith("https://")


def test_public_api_matches_catalog_alias(public_api_client: TestClient) -> None:
    public = public_api_client.get("/api/v1/datasets/search", params={"language": "Swahili"})
    catalog = public_api_client.get("/catalog/datasets/search", params={"language": "Swahili"})
    assert public.status_code == 200
    assert catalog.status_code == 200
    assert public.json() == catalog.json()


def test_public_api_is_read_only(public_api_client: TestClient) -> None:
    write_attempts = [
        ("POST", "/api/v1/datasets/search", {"language": "yor"}),
        ("PUT", "/api/v1/datasets/1", {"title": "hack"}),
        ("DELETE", "/api/v1/datasets/1", None),
        ("POST", "/api/v1/datasets/filter", {"language": "yor", "task": "asr"}),
    ]
    for method, path, json_body in write_attempts:
        response = public_api_client.request(method, path, json=json_body)
        assert response.status_code == 405

    openapi = public_api_client.get("/openapi.json")
    assert openapi.status_code == 200
    paths = openapi.json()["paths"]
    for path, operations in paths.items():
        if not path.startswith("/api/v1"):
            continue
        for method in operations:
            assert method.lower() == "get", f"Écriture exposée sur {method.upper()} {path}"
