from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

import accounts.models  # noqa: F401
from catalog.seed import seed_catalog
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from core.models import Dataset
from main import app


@pytest.fixture()
def contributor_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "contributor.db"
    test_engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(test_engine)
    init_fts5(test_engine)

    with Session(test_engine) as session:
        seed_catalog(session)

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("ACCOUNTS_STUB", "false")
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
        yield client, test_engine

    app.dependency_overrides.clear()
    get_settings.cache_clear()
    for key in ("DATABASE_URL", "ACCOUNTS_STUB", "CATALOG_STUB", "CATALOG_AUTO_SEED"):
        monkeypatch.delenv(key, raising=False)


def _register(client: TestClient, email: str, name: str) -> None:
    response = client.post(
        "/accounts/auth/register",
        json={"email": email, "password": "password123", "display_name": name},
    )
    assert response.status_code == 201


def _login(client: TestClient, email: str) -> str:
    response = client.post(
        "/accounts/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _submit(client: TestClient, token: str, title: str = "Corpus Twi") -> dict:
    response = client.post(
        "/accounts/datasets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": title,
            "source_url": "https://example.com/datasets/twi-corpus",
            "language": "twi",
            "task": "asr",
            "description": "Corpus vocal twi",
            "license_name": "CC BY 4.0",
            "data_format": "audio",
            "size": "500 MB",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_contributor_submit_and_list_mine(contributor_client) -> None:
    client, engine = contributor_client
    _register(client, "kofi@example.com", "Kofi")
    token = _login(client, "kofi@example.com")

    created = _submit(client, token)
    assert created["provenance"] == "contribué"
    assert created["language"]["code"] == "twi"
    assert created["tasks"][0]["code"] == "asr"

    with Session(engine) as session:
        row = session.get(Dataset, created["id"])
        assert row is not None
        assert row.contributor_account_id is not None
        assert row.provenance.value == "contribué"

    mine = client.get("/accounts/datasets/mine", headers={"Authorization": f"Bearer {token}"})
    assert mine.status_code == 200
    body = mine.json()
    assert body["total"] == 1
    assert body["datasets"][0]["title"] == "Corpus Twi"

    catalog = client.get(f"/catalog/datasets/{created['id']}")
    assert catalog.status_code == 200


def test_contributor_update_and_delete_own_dataset(contributor_client) -> None:
    client, _engine = contributor_client
    _register(client, "ada@example.com", "Ada")
    token = _login(client, "ada@example.com")
    created = _submit(client, token)
    dataset_id = created["id"]
    headers = {"Authorization": f"Bearer {token}"}

    patched = client.patch(
        f"/accounts/datasets/{dataset_id}",
        headers=headers,
        json={"title": "Corpus Twi v2"},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Corpus Twi v2"

    deleted = client.delete(f"/accounts/datasets/{dataset_id}", headers=headers)
    assert deleted.status_code == 200

    mine = client.get("/accounts/datasets/mine", headers=headers)
    assert mine.json()["total"] == 0


def test_contributor_cannot_modify_other_account_dataset(contributor_client) -> None:
    client, _engine = contributor_client
    _register(client, "owner@example.com", "Owner")
    _register(client, "other@example.com", "Other")
    owner_token = _login(client, "owner@example.com")
    other_token = _login(client, "other@example.com")

    created = _submit(client, owner_token)
    dataset_id = created["id"]

    forbidden = client.patch(
        f"/accounts/datasets/{dataset_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"title": "Vol"},
    )
    assert forbidden.status_code == 403

    owner_mine = client.get("/accounts/datasets/mine", headers={"Authorization": f"Bearer {owner_token}"})
    assert owner_mine.json()["total"] == 1


def test_contributor_cannot_delete_seeded_dataset_without_ownership(contributor_client) -> None:
    client, _engine = contributor_client
    _register(client, "researcher@example.com", "Researcher")
    token = _login(client, "researcher@example.com")

    response = client.delete("/accounts/datasets/1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
