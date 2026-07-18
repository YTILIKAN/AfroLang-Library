from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select

import accounts.models  # noqa: F401
from catalog.seed import seed_catalog
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from core.models import Account, AccountRole
from main import app


@pytest.fixture()
def admin_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "admin_datasets.db"
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


@pytest.fixture()
def stub_admin(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ACCOUNTS_STUB", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    monkeypatch.delenv("ACCOUNTS_STUB", raising=False)


def _register(client: TestClient, email: str, name: str = "User") -> None:
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


def _promote_to_admin(engine, email: str) -> None:
    with Session(engine) as session:
        account = session.exec(select(Account).where(Account.email == email)).one()
        account.role = AccountRole.ADMIN
        session.add(account)
        session.commit()


def test_admin_lists_all_datasets(admin_client) -> None:
    client, engine = admin_client
    _register(client, "admin@example.com")
    _promote_to_admin(engine, "admin@example.com")
    token = _login(client, "admin@example.com")

    response = client.get("/accounts/admin/datasets", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 4
    assert len(body["datasets"]) == body["total"]


def test_researcher_cannot_access_admin_datasets(admin_client) -> None:
    client, engine = admin_client
    _register(client, "researcher@example.com")
    token = _login(client, "researcher@example.com")

    response = client.get("/accounts/admin/datasets", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_crud_dataset_lifecycle(admin_client) -> None:
    client, engine = admin_client
    _register(client, "admin2@example.com")
    _promote_to_admin(engine, "admin2@example.com")
    token = _login(client, "admin2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/accounts/admin/datasets",
        headers=headers,
        json={
            "title": "Ghomala Reference",
            "source_url": "https://example.org/ghomala",
            "language": "yor",
            "task": "classification",
            "provenance": "manuel",
            "external_id": "manual/ghomala-ref",
        },
    )
    assert create.status_code == 201
    created = create.json()
    dataset_id = created["id"]
    assert created["provenance"] == "manuel"
    assert created["source_url"].startswith("https://")

    detail = client.get(f"/accounts/admin/datasets/{dataset_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["title"] == "Ghomala Reference"

    update = client.patch(
        f"/accounts/admin/datasets/{dataset_id}",
        headers=headers,
        json={"title": "Ghomala Reference (corrigé)"},
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Ghomala Reference (corrigé)"

    delete = client.delete(f"/accounts/admin/datasets/{dataset_id}", headers=headers)
    assert delete.status_code == 200

    missing = client.get(f"/accounts/admin/datasets/{dataset_id}", headers=headers)
    assert missing.status_code == 404


def test_admin_can_delete_synchronised_dataset(admin_client) -> None:
    client, engine = admin_client
    _register(client, "admin3@example.com")
    _promote_to_admin(engine, "admin3@example.com")
    token = _login(client, "admin3@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    listing = client.get("/accounts/admin/datasets", headers=headers).json()
    synchronised = next(item for item in listing["datasets"] if item["provenance"] == "synchronisé")

    delete = client.delete(f"/accounts/admin/datasets/{synchronised['id']}", headers=headers)
    assert delete.status_code == 200


def test_stub_admin_dataset_crud(stub_admin) -> None:
    client = TestClient(app)
    token = client.post(
        "/accounts/auth/login",
        json={"email": "admin@afriland.org", "password": "admin123"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    listing = client.get("/accounts/admin/datasets", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] >= 3

    create = client.post(
        "/accounts/admin/datasets",
        headers=headers,
        json={
            "title": "Stub Admin Dataset",
            "source_url": "https://example.org/stub",
            "language": "wol",
            "task": "nmt",
        },
    )
    assert create.status_code == 201
    dataset_id = create.json()["id"]

    delete = client.delete(f"/accounts/admin/datasets/{dataset_id}", headers=headers)
    assert delete.status_code == 200
