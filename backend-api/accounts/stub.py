from datetime import datetime, timedelta, timezone

from accounts.api_schemas import (
    AccountResponse,
    AdminAccountsResponse,
    MessageResponse,
    MyDatasetsResponse,
    SubmitDatasetRequest,
    TokenResponse,
)
from accounts.auth import hash_password
from core.models import AccountRole

_STUB_PASSWORD = "password123"
_STUB_ADMIN_PASSWORD = "admin123"

_STUB_ACCOUNTS: dict[str, dict] = {}


def _ensure_stub_accounts() -> None:
    if _STUB_ACCOUNTS:
        return
    _STUB_ACCOUNTS.update(
        {
            "kofi@example.com": {
                "id": 101,
                "display_name": "Kofi Mensah",
                "role": AccountRole.CHERCHEUR,
                "password_hash": hash_password(_STUB_PASSWORD),
            },
            "admin@afriland.org": {
                "id": 1,
                "display_name": "Admin AfroLang",
                "role": AccountRole.ADMIN,
                "password_hash": hash_password(_STUB_ADMIN_PASSWORD),
            },
        }
    )

_STUB_TOKENS: dict[str, str] = {}
_STUB_MY_DATASETS: dict[int, list[dict]] = {
    101: [
        {
            "id": 9001,
            "title": "Twi Speech Samples (contribué)",
            "language_code": "twi",
            "source_url": "https://huggingface.co/datasets/kofi/twi-speech",
            "provenance": "contribué",
            "tasks": [{"code": "asr", "label": "ASR"}],
        }
    ],
}


def _account_response(email: str, data: dict) -> AccountResponse:
    return AccountResponse(
        id=data["id"],
        email=email,
        display_name=data["display_name"],
        role=data["role"],
        is_active=True,
        created_at=datetime(2026, 1, 15, tzinfo=timezone.utc),
    )


def register(email: str, display_name: str, password: str) -> AccountResponse:
    _ensure_stub_accounts()
    normalized = email.strip().lower()
    if normalized in _STUB_ACCOUNTS:
        raise ValueError("Un compte existe déjà avec cet e-mail")
    account_id = max((data["id"] for data in _STUB_ACCOUNTS.values()), default=100) + 1
    _STUB_ACCOUNTS[normalized] = {
        "id": account_id,
        "display_name": display_name.strip(),
        "role": AccountRole.CHERCHEUR,
        "password_hash": hash_password(password),
    }
    _STUB_MY_DATASETS[account_id] = []
    return _account_response(normalized, _STUB_ACCOUNTS[normalized])


def login(email: str, password: str) -> TokenResponse:
    from accounts.auth import verify_password

    _ensure_stub_accounts()
    normalized = email.strip().lower()
    data = _STUB_ACCOUNTS.get(normalized)
    if data is None or not verify_password(password, data["password_hash"]):
        raise ValueError("Identifiants invalides")

    token = f"stub-token-{data['id']}-{len(_STUB_TOKENS)}"
    _STUB_TOKENS[token] = normalized
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    return TokenResponse(
        access_token=token,
        expires_at=expires_at,
        account=_account_response(normalized, data),
    )


def logout(token: str) -> None:
    _STUB_TOKENS.pop(token, None)


def resolve_account(token: str) -> AccountResponse:
    _ensure_stub_accounts()
    email = _STUB_TOKENS.get(token)
    if email is None:
        raise LookupError("Session invalide")
    return _account_response(email, _STUB_ACCOUNTS[email])


def submit_dataset(account_id: int, payload: SubmitDatasetRequest) -> dict:
    dataset_id = 9000 + account_id + len(_STUB_MY_DATASETS.get(account_id, []))
    dataset = {
        "id": dataset_id,
        "title": payload.title,
        "language_code": payload.language,
        "source_url": payload.source_url,
        "provenance": "contribué",
        "tasks": [{"code": payload.task, "label": payload.task.upper()}],
        "description": payload.description or "inconnu",
    }
    _STUB_MY_DATASETS.setdefault(account_id, []).append(dataset)
    return dataset


def list_my_datasets(account_id: int) -> MyDatasetsResponse:
    datasets = _STUB_MY_DATASETS.get(account_id, [])
    return MyDatasetsResponse(total=len(datasets), datasets=datasets)


def update_my_dataset(account_id: int, dataset_id: int, title: str | None) -> dict:
    for dataset in _STUB_MY_DATASETS.get(account_id, []):
        if dataset["id"] == dataset_id:
            if title is not None:
                dataset["title"] = title
            return dataset
    raise LookupError("Dataset introuvable")


def delete_my_dataset(account_id: int, dataset_id: int) -> MessageResponse:
    datasets = _STUB_MY_DATASETS.get(account_id, [])
    for index, dataset in enumerate(datasets):
        if dataset["id"] == dataset_id:
            datasets.pop(index)
            return MessageResponse(detail="Dataset supprimé")
    raise LookupError("Dataset introuvable")


def admin_list_accounts() -> AdminAccountsResponse:
    _ensure_stub_accounts()
    accounts = [_account_response(email, data) for email, data in _STUB_ACCOUNTS.items()]
    return AdminAccountsResponse(total=len(accounts), accounts=accounts)
