from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select

import accounts.models  # noqa: F401
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from core.models import Account, AccountRole
from main import app


@pytest.fixture()
def admin_accounts_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "admin_accounts.db"
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
        yield client, test_engine

    app.dependency_overrides.clear()
    get_settings.cache_clear()
    for key in ("DATABASE_URL", "ACCOUNTS_STUB", "CATALOG_STUB", "CATALOG_AUTO_SEED"):
        monkeypatch.delenv(key, raising=False)


@pytest.fixture()
def stub_admin_accounts(monkeypatch: pytest.MonkeyPatch):
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


def _login(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/accounts/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _promote_to_admin(engine, email: str) -> None:
    with Session(engine) as session:
        account = session.exec(select(Account).where(Account.email == email)).one()
        account.role = AccountRole.ADMIN
        session.add(account)
        session.commit()


def test_admin_creates_and_lists_accounts(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "admin@example.com")
    _promote_to_admin(engine, "admin@example.com")
    token = _login(client, "admin@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/accounts/admin/accounts",
        headers=headers,
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "display_name": "New User",
            "role": "chercheur",
        },
    )
    assert create.status_code == 201
    assert create.json()["email"] == "newuser@example.com"
    assert create.json()["role"] == "chercheur"

    listing = client.get("/accounts/admin/accounts", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] >= 2


def test_researcher_cannot_manage_accounts(admin_accounts_client) -> None:
    client, _engine = admin_accounts_client
    _register(client, "researcher@example.com")
    token = _login(client, "researcher@example.com")

    response = client.post(
        "/accounts/admin/accounts",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "blocked@example.com",
            "password": "password123",
            "display_name": "Blocked",
        },
    )
    assert response.status_code == 403


def test_admin_updates_role_and_disables_account(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "admin2@example.com")
    _promote_to_admin(engine, "admin2@example.com")
    admin_token = _login(client, "admin2@example.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    create = client.post(
        "/accounts/admin/accounts",
        headers=admin_headers,
        json={
            "email": "target@example.com",
            "password": "password123",
            "display_name": "Target User",
            "role": "chercheur",
        },
    )
    account_id = create.json()["id"]
    user_token = _login(client, "target@example.com")

    promote = client.patch(
        f"/accounts/admin/accounts/{account_id}",
        headers=admin_headers,
        json={"role": "admin"},
    )
    assert promote.status_code == 200
    assert promote.json()["role"] == "admin"

    disable = client.patch(
        f"/accounts/admin/accounts/{account_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert disable.status_code == 200
    assert disable.json()["is_active"] is False

    login_disabled = client.post(
        "/accounts/auth/login",
        json={"email": "target@example.com", "password": "password123"},
    )
    assert login_disabled.status_code == 403

    me = client.get("/accounts/me", headers={"Authorization": f"Bearer {user_token}"})
    assert me.status_code == 401


def test_disabled_account_cannot_contribute_via_stub(stub_admin_accounts) -> None:
    client = TestClient(app)
    admin_token = client.post(
        "/accounts/auth/login",
        json={"email": "admin@afriland.org", "password": "admin123"},
    ).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    create = client.post(
        "/accounts/admin/accounts",
        headers=admin_headers,
        json={
            "email": "temp@example.com",
            "password": "password123",
            "display_name": "Temp User",
        },
    )
    account_id = create.json()["id"]
    user_token = client.post(
        "/accounts/auth/login",
        json={"email": "temp@example.com", "password": "password123"},
    ).json()["access_token"]

    client.patch(
        f"/accounts/admin/accounts/{account_id}",
        headers=admin_headers,
        json={"is_active": False},
    )

    contribution = client.post(
        "/accounts/datasets",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "title": "Should fail",
            "source_url": "https://example.com/x",
            "language": "yor",
            "task": "asr",
        },
    )
    assert contribution.status_code == 401


def test_stub_admin_account_crud(stub_admin_accounts) -> None:
    client = TestClient(app)
    token = client.post(
        "/accounts/auth/login",
        json={"email": "admin@afriland.org", "password": "admin123"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/accounts/admin/accounts",
        headers=headers,
        json={
            "email": "stubuser@example.com",
            "password": "password123",
            "display_name": "Stub User",
            "role": "admin",
        },
    )
    assert create.status_code == 201
    account_id = create.json()["id"]

    detail = client.get(f"/accounts/admin/accounts/{account_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["role"] == "admin"
