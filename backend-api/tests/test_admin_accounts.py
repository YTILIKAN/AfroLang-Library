from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select

import accounts.models  # noqa: F401
from core import models  # noqa: F401
from core.config import get_settings
from core.database import get_session
from core.fts import init_fts5
from accounts.repository import AccountsRepository
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


def _make_super_admin(engine, email: str) -> int:
    """Promeut un compte en super admin par la base — le drapeau n'a aucune route."""
    with Session(engine) as session:
        repository = AccountsRepository(session)
        account = repository.get_account_by_email(email)
        assert account is not None
        return repository.promote_super_admin(account).id


def test_admin_cannot_demote_itself(admin_accounts_client) -> None:
    """Se rétrograder soi-même laissait l'interface admin ouverte mais tous ses appels en 403."""
    client, engine = admin_accounts_client
    _register(client, "solo@example.com")
    _promote_to_admin(engine, "solo@example.com")
    headers = {"Authorization": f"Bearer {_login(client, 'solo@example.com')}"}
    me_id = client.get("/accounts/me", headers=headers).json()["id"]

    demote = client.patch(
        f"/accounts/admin/accounts/{me_id}",
        headers=headers,
        json={"role": "chercheur"},
    )
    assert demote.status_code == 403

    # Le rôle tient : les routes admin répondent encore avec le même jeton.
    assert client.get("/accounts/admin/accounts", headers=headers).status_code == 200
    assert client.get("/accounts/me", headers=headers).json()["role"] == "admin"


def test_admin_updates_own_name_with_role_unchanged(admin_accounts_client) -> None:
    """Le garde ne vise que le changement de rôle — renvoyer le rôle courant reste permis."""
    client, engine = admin_accounts_client
    _register(client, "keeper@example.com")
    _promote_to_admin(engine, "keeper@example.com")
    headers = {"Authorization": f"Bearer {_login(client, 'keeper@example.com')}"}
    me_id = client.get("/accounts/me", headers=headers).json()["id"]

    response = client.patch(
        f"/accounts/admin/accounts/{me_id}",
        headers=headers,
        json={"display_name": "Keeper", "role": "admin"},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Keeper"
    assert response.json()["role"] == "admin"


def test_super_admin_cannot_be_disabled_by_another_admin(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "boss@example.com")
    super_admin_id = _make_super_admin(engine, "boss@example.com")

    _register(client, "other@example.com")
    _promote_to_admin(engine, "other@example.com")
    headers = {"Authorization": f"Bearer {_login(client, 'other@example.com')}"}

    disable = client.patch(
        f"/accounts/admin/accounts/{super_admin_id}",
        headers=headers,
        json={"is_active": False},
    )
    assert disable.status_code == 403

    demote = client.patch(
        f"/accounts/admin/accounts/{super_admin_id}",
        headers=headers,
        json={"role": "chercheur"},
    )
    assert demote.status_code == 403

    # Le super admin reste actif et administrateur, et peut toujours se connecter.
    assert _login(client, "boss@example.com")
    fetched = client.get(f"/accounts/admin/accounts/{super_admin_id}", headers=headers).json()
    assert fetched["is_active"] is True
    assert fetched["role"] == "admin"
    assert fetched["is_super_admin"] is True


def test_super_admin_cannot_demote_or_disable_itself(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "boss2@example.com")
    super_admin_id = _make_super_admin(engine, "boss2@example.com")
    headers = {"Authorization": f"Bearer {_login(client, 'boss2@example.com')}"}

    assert (
        client.patch(
            f"/accounts/admin/accounts/{super_admin_id}",
            headers=headers,
            json={"role": "chercheur"},
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/accounts/admin/accounts/{super_admin_id}",
            headers=headers,
            json={"is_active": False},
        ).status_code
        == 400
    )


def test_super_admin_keeps_protection_after_changing_its_details(admin_accounts_client) -> None:
    """La protection tient au drapeau porté par la ligne, pas à l'e-mail semé."""
    client, engine = admin_accounts_client
    _register(client, "boss3@example.com")
    super_admin_id = _make_super_admin(engine, "boss3@example.com")
    own_headers = {"Authorization": f"Bearer {_login(client, 'boss3@example.com')}"}

    renamed = client.patch(
        f"/accounts/admin/accounts/{super_admin_id}",
        headers=own_headers,
        json={"display_name": "Nouveau Nom"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["display_name"] == "Nouveau Nom"
    assert renamed.json()["is_super_admin"] is True

    _register(client, "other3@example.com")
    _promote_to_admin(engine, "other3@example.com")
    other_headers = {"Authorization": f"Bearer {_login(client, 'other3@example.com')}"}
    assert (
        client.patch(
            f"/accounts/admin/accounts/{super_admin_id}",
            headers=other_headers,
            json={"is_active": False},
        ).status_code
        == 403
    )


def test_super_admin_flag_is_not_assignable_through_the_api(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "boss4@example.com")
    _make_super_admin(engine, "boss4@example.com")
    _register(client, "climber@example.com")
    _promote_to_admin(engine, "climber@example.com")
    headers = {"Authorization": f"Bearer {_login(client, 'climber@example.com')}"}

    created = client.post(
        "/accounts/admin/accounts",
        headers=headers,
        json={
            "email": "usurper@example.com",
            "password": "password123",
            "display_name": "Usurper",
            "role": "admin",
            "is_super_admin": True,
        },
    )
    assert created.status_code == 201
    assert created.json()["is_super_admin"] is False

    promoted = client.patch(
        f"/accounts/admin/accounts/{created.json()['id']}",
        headers=headers,
        json={"is_super_admin": True},
    )
    assert promoted.status_code == 200
    assert promoted.json()["is_super_admin"] is False


def test_promote_super_admin_keeps_a_single_holder(admin_accounts_client) -> None:
    client, engine = admin_accounts_client
    _register(client, "boss5@example.com")
    first_id = _make_super_admin(engine, "boss5@example.com")
    _register(client, "successor@example.com")
    second_id = _make_super_admin(engine, "successor@example.com")

    with Session(engine) as session:
        holders = session.exec(
            select(Account).where(Account.is_super_admin == True)  # noqa: E712
        ).all()
    assert [account.id for account in holders] == [second_id]
    with Session(engine) as session:
        # L'ancien détenteur reste admin ordinaire, il n'est pas désactivé.
        previous = session.get(Account, first_id)
        assert previous.is_super_admin is False
        assert previous.role == AccountRole.ADMIN
        assert previous.is_active is True


def test_stub_super_admin_cannot_be_disabled(stub_admin_accounts) -> None:
    client = TestClient(app)
    admin_headers = {
        "Authorization": "Bearer "
        + client.post(
            "/accounts/auth/login",
            json={"email": "admin@afriland.org", "password": "admin123"},
        ).json()["access_token"]
    }

    created = client.post(
        "/accounts/admin/accounts",
        headers=admin_headers,
        json={
            "email": "second-admin@example.com",
            "password": "password123",
            "display_name": "Second Admin",
            "role": "admin",
        },
    )
    assert created.status_code == 201
    second_headers = {
        "Authorization": "Bearer "
        + client.post(
            "/accounts/auth/login",
            json={"email": "second-admin@example.com", "password": "password123"},
        ).json()["access_token"]
    }

    super_admin_id = client.get(
        "/accounts/admin/accounts", headers=admin_headers
    ).json()["accounts"]
    super_admin_id = next(a["id"] for a in super_admin_id if a["is_super_admin"])

    assert (
        client.patch(
            f"/accounts/admin/accounts/{super_admin_id}",
            headers=second_headers,
            json={"is_active": False},
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/accounts/admin/accounts/{super_admin_id}",
            headers=second_headers,
            json={"role": "chercheur"},
        ).status_code
        == 403
    )
