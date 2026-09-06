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
    db_path = tmp_path / "catalog_filter.db"
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


def test_filter_requires_at_least_one_parameter(catalog_client: TestClient) -> None:
    response = catalog_client.get("/catalog/datasets/filter")
    assert response.status_code == 400


def test_combined_language_and_task_filter(catalog_client: TestClient) -> None:
    yor_asr = catalog_client.get("/catalog/datasets/filter", params={"language": "yor", "task": "asr"})
    yor_classification = catalog_client.get(
        "/catalog/datasets/filter",
        params={"language": "yor", "task": "classification"},
    )

    assert yor_asr.status_code == 200
    assert yor_classification.status_code == 200

    asr_body = yor_asr.json()
    class_body = yor_classification.json()

    assert asr_body["total"] == 1
    assert class_body["total"] == 1
    assert asr_body["datasets"][0]["tasks"][0]["code"] == "asr"
    assert class_body["datasets"][0]["tasks"][0]["code"] == "classification"
    assert asr_body["datasets"][0]["id"] != class_body["datasets"][0]["id"]


def test_swahili_and_asr_returns_empty_intersection(catalog_client: TestClient) -> None:
    response = catalog_client.get(
        "/catalog/datasets/filter",
        params={"language": "Swahili", "task": "ASR"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["language_code"] == "swh"
    assert body["filters"]["task_code"] == "asr"
    assert body["total"] == 0
    assert body["datasets"] == []


def test_filter_by_normalized_source_and_format(catalog_client: TestClient) -> None:
    response = catalog_client.get(
        "/catalog/datasets/filter",
        params={"source": "HuggingFace", "data_format": "audio"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["source"] == "huggingface"
    assert body["filters"]["data_format"] == "audio"
    # Le seed grandit : on vérifie le filtre, pas un décompte figé.
    assert body["total"] >= 1
    assert all(
        dataset["source"]["slug"] == "huggingface" and dataset["data_format"] == "audio"
        for dataset in body["datasets"]
    )
    assert "yor" in {dataset["language"]["code"] for dataset in body["datasets"]}


def test_task_filter_uses_controlled_vocabulary_not_raw_tags(catalog_client: TestClient) -> None:
    response = catalog_client.get(
        "/catalog/datasets/filter",
        params={"task": "automatic-speech-recognition"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["task_code"] == "asr"
    assert body["total"] >= 1
    assert all("asr" in [task["code"] for task in dataset["tasks"]] for dataset in body["datasets"])


def test_stub_filter_contract(stub_catalog) -> None:
    client = TestClient(app)
    response = client.get("/catalog/datasets/filter", params={"language": "yor", "task": "asr"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert "filters" in body


def test_free_text_query_matches_metadata(catalog_client: TestClient) -> None:
    """La barre de recherche unifiée interroge le plein texte (FR-11)."""
    response = catalog_client.get("/catalog/datasets/filter", params={"q": "yoruba"})
    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["q"] == "yoruba"
    assert body["total"] >= 1


def test_free_text_query_combines_with_facets(catalog_client: TestClient) -> None:
    """Plein texte et facettes se cumulent en ET : le résultat est un sous-ensemble."""
    text_only = catalog_client.get("/catalog/datasets/filter", params={"q": "corpus"}).json()
    combined = catalog_client.get(
        "/catalog/datasets/filter",
        params={"q": "corpus", "data_format": "audio"},
    ).json()

    assert combined["filters"]["q"] == "corpus"
    assert combined["filters"]["data_format"] == "audio"
    assert combined["total"] <= text_only["total"]
    assert all(dataset["data_format"] == "audio" for dataset in combined["datasets"])


def test_free_text_query_without_match_returns_empty(catalog_client: TestClient) -> None:
    response = catalog_client.get("/catalog/datasets/filter", params={"q": "zzzzzunmatched"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["datasets"] == []


def test_free_text_query_tolerates_fts_operators(catalog_client: TestClient) -> None:
    """Une saisie contenant des opérateurs FTS5 ne doit pas produire d'erreur SQL."""
    for raw in ['yoruba OR "', "asr - NEAR(", "swahili:", "*"]:
        response = catalog_client.get("/catalog/datasets/filter", params={"q": raw})
        assert response.status_code == 200, raw


def test_free_text_query_alone_satisfies_the_minimum_criterion(catalog_client: TestClient) -> None:
    """`q` compte comme critère : la recherche seule ne doit pas être rejetée en 400."""
    assert catalog_client.get("/catalog/datasets/filter", params={"q": "corpus"}).status_code == 200
    assert catalog_client.get("/catalog/datasets/filter").status_code == 400


def test_stub_free_text_contract(stub_catalog) -> None:
    client = TestClient(app)
    response = client.get("/catalog/datasets/filter", params={"q": "yoruba"})
    assert response.status_code == 200
    body = response.json()
    assert body["filters"]["q"] == "yoruba"
