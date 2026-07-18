from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

import accounts.models  # noqa: F401
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from main import app


@pytest.fixture()
def accounts_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "accounts.db"
    test_engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(test_engine)
    init_fts5(test_engine)

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("ACCOUNTS_STUB", "false")
    monkeypatch.setenv("CATALOG_STUB", "true")
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
    for key in ("DATABASE_URL", "ACCOUNTS_STUB", "CATALOG_STUB", "CATALOG_AUTO_SEED"):
        monkeypatch.delenv(key, raising=False)


@pytest.fixture()
def stub_accounts(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ACCOUNTS_STUB", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    monkeypatch.delenv("ACCOUNTS_STUB", raising=False)


def _register(client: TestClient, email: str = "user@example.com") -> None:
    response = client.post(
        "/accounts/auth/register",
        json={"email": email, "password": "password123", "display_name": "Test User"},
    )
    assert response.status_code == 201


def _login(client: TestClient, email: str = "user@example.com") -> str:
    response = client.post(
        "/accounts/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_register_and_login(accounts_client: TestClient) -> None:
    _register(accounts_client)
    token = _login(accounts_client)

    me = accounts_client.get("/accounts/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "user@example.com"
    assert body["role"] == "chercheur"
    assert body["is_active"] is True


def test_register_duplicate_email_returns_409(accounts_client: TestClient) -> None:
    _register(accounts_client)
    response = accounts_client.post(
        "/accounts/auth/register",
        json={"email": "user@example.com", "password": "password123", "display_name": "Autre"},
    )
    assert response.status_code == 409


def test_login_invalid_credentials_returns_401(accounts_client: TestClient) -> None:
    _register(accounts_client)
    response = accounts_client.post(
        "/accounts/auth/login",
        json={"email": "user@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_logout_invalidates_token(accounts_client: TestClient) -> None:
    _register(accounts_client)
    token = _login(accounts_client)

    logout = accounts_client.post("/accounts/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 204

    me = accounts_client.get("/accounts/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 401


def test_catalog_remains_public_without_account(accounts_client: TestClient) -> None:
    response = accounts_client.get("/catalog/datasets/search", params={"language": "yor"})
    assert response.status_code == 200


def test_contribution_returns_501_without_stub(accounts_client: TestClient) -> None:
    _register(accounts_client)
    token = _login(accounts_client)

    response = accounts_client.post(
        "/accounts/datasets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Test Dataset",
            "source_url": "https://example.com/ds",
            "language": "yor",
            "task": "asr",
        },
    )
    assert response.status_code == 501


def test_stub_login_and_contribution(stub_accounts) -> None:
    client = TestClient(app)
    login = client.post(
        "/accounts/auth/login",
        json={"email": "kofi@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    submit = client.post(
        "/accounts/datasets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Nouveau corpus",
            "source_url": "https://example.com/new",
            "language": "twi",
            "task": "asr",
        },
    )
    assert submit.status_code == 201

    mine = client.get("/accounts/datasets/mine", headers={"Authorization": f"Bearer {token}"})
    assert mine.status_code == 200
    assert mine.json()["total"] >= 2


def test_stub_admin_requires_admin_role(stub_accounts) -> None:
    client = TestClient(app)
    researcher = client.post(
        "/accounts/auth/login",
        json={"email": "kofi@example.com", "password": "password123"},
    ).json()["access_token"]

    forbidden = client.get("/accounts/admin/accounts", headers={"Authorization": f"Bearer {researcher}"})
    assert forbidden.status_code == 403

    admin_token = client.post(
        "/accounts/auth/login",
        json={"email": "admin@afriland.org", "password": "admin123"},
    ).json()["access_token"]
    admin_list = client.get("/accounts/admin/accounts", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_list.status_code == 200
    assert admin_list.json()["total"] >= 2
