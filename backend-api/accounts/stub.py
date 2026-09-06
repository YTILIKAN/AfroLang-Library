from datetime import datetime, timedelta, timezone

from accounts.api_schemas import (
    AccountResponse,
    AdminAccountCreateRequest,
    AdminAccountUpdateRequest,
    AdminAccountsResponse,
    AdminDatasetCreateRequest,
    AdminDatasetListResponse,
    AdminDatasetUpdateRequest,
    MessageResponse,
    MyDatasetsResponse,
    SubmitDatasetRequest,
    TokenResponse,
)
from catalog.api_schemas import (
    DatasetDetailResponse,
    DatasetSummaryResponse,
    LanguageResponse,
    LicenseResponse,
    SourceResponse,
    TaskResponse,
)
from catalog import stub as catalog_stub
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
                "is_active": True,
            },
            "admin@afriland.org": {
                "id": 1,
                "display_name": "Admin AfroLang",
                "role": AccountRole.ADMIN,
                "password_hash": hash_password(_STUB_ADMIN_PASSWORD),
                "is_active": True,
                "is_super_admin": True,
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
        is_active=data.get("is_active", True),
        is_super_admin=data.get("is_super_admin", False),
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
        "is_active": True,
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
    if not data.get("is_active", True):
        raise ValueError("Compte désactivé")

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
    data = _STUB_ACCOUNTS[email]
    if not data.get("is_active", True):
        raise LookupError("Compte indisponible")
    return _account_response(email, data)


def _contribution_detail(stored: dict) -> DatasetDetailResponse:
    now = datetime.now(timezone.utc)
    lang_code = stored.get("language_code", "inconnu")
    tasks = stored.get("tasks", [])
    return DatasetDetailResponse(
        id=stored["id"],
        external_id=stored.get("external_id", f"stub/{stored['id']}"),
        title=stored["title"],
        description=stored.get("description", "inconnu"),
        language=LanguageResponse(code=lang_code, name=lang_code, family="inconnu", region="inconnu"),
        language_raw=lang_code,
        source=SourceResponse(slug="contribution", name="Contribution", base_url="https://example.com"),
        license=None,
        provenance=stored.get("provenance", "contribué"),
        data_format=stored.get("data_format", "inconnu"),
        size=stored.get("size", "inconnu"),
        source_url=stored["source_url"],
        tasks=[TaskResponse(code=task["code"], label=task["label"]) for task in tasks],
        published_at=None,
        created_at=now,
        updated_at=now,
    )


def _contribution_summary(stored: dict) -> DatasetSummaryResponse:
    detail = _contribution_detail(stored)
    return DatasetSummaryResponse(**detail.model_dump(exclude={"created_at", "updated_at"}))


def submit_dataset(account_id: int, payload: SubmitDatasetRequest) -> DatasetDetailResponse:
    dataset_id = 9000 + account_id + len(_STUB_MY_DATASETS.get(account_id, []))
    dataset = {
        "id": dataset_id,
        "title": payload.title,
        "language_code": payload.language,
        "source_url": payload.source_url,
        "provenance": "manuel" if payload.manual_source else "contribué",
        "tasks": [{"code": payload.task, "label": payload.task.upper()}],
        "description": payload.description or "inconnu",
        "data_format": payload.data_format or "inconnu",
        "size": payload.size or "inconnu",
    }
    _STUB_MY_DATASETS.setdefault(account_id, []).append(dataset)
    return _contribution_detail(dataset)


def list_my_datasets(account_id: int) -> MyDatasetsResponse:
    datasets = [_contribution_summary(item) for item in _STUB_MY_DATASETS.get(account_id, [])]
    return MyDatasetsResponse(total=len(datasets), datasets=datasets)


def update_my_dataset(account_id: int, dataset_id: int, title: str | None) -> DatasetDetailResponse:
    for dataset in _STUB_MY_DATASETS.get(account_id, []):
        if dataset["id"] == dataset_id:
            if title is not None:
                dataset["title"] = title
            return _contribution_detail(dataset)
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


def admin_get_account(account_id: int) -> AccountResponse:
    _ensure_stub_accounts()
    for email, data in _STUB_ACCOUNTS.items():
        if data["id"] == account_id:
            return _account_response(email, data)
    raise LookupError("Compte introuvable")


def admin_create_account(payload: AdminAccountCreateRequest) -> AccountResponse:
    _ensure_stub_accounts()
    normalized = payload.email.strip().lower()
    if normalized in _STUB_ACCOUNTS:
        raise ValueError("Un compte existe déjà avec cet e-mail")
    account_id = max(data["id"] for data in _STUB_ACCOUNTS.values()) + 1
    _STUB_ACCOUNTS[normalized] = {
        "id": account_id,
        "display_name": payload.display_name.strip(),
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "is_active": True,
    }
    _STUB_MY_DATASETS[account_id] = []
    return _account_response(normalized, _STUB_ACCOUNTS[normalized])


def admin_update_account(
    account_id: int,
    payload: AdminAccountUpdateRequest,
    *,
    acting_account_id: int | None = None,
) -> AccountResponse:
    _ensure_stub_accounts()
    for email, data in _STUB_ACCOUNTS.items():
        if data["id"] != account_id:
            continue
        if data.get("is_super_admin", False):
            if account_id != acting_account_id:
                if payload.is_active is False:
                    raise PermissionError("Le compte super admin ne peut pas être désactivé")
                if payload.role is not None and payload.role != data["role"]:
                    raise PermissionError("Le rôle du compte super admin ne peut pas être modifié")
            if payload.role is not None and payload.role != AccountRole.ADMIN:
                raise PermissionError("Le compte super admin doit conserver le rôle admin")
        if payload.display_name is not None:
            data["display_name"] = payload.display_name.strip()
        if payload.role is not None:
            data["role"] = payload.role
        if payload.is_active is not None:
            data["is_active"] = payload.is_active
            if not payload.is_active:
                tokens_to_remove = [token for token, mapped_email in _STUB_TOKENS.items() if mapped_email == email]
                for token in tokens_to_remove:
                    _STUB_TOKENS.pop(token, None)
        return _account_response(email, data)
    raise LookupError("Compte introuvable")


_STUB_ADMIN_DATASETS: list[DatasetDetailResponse] = []
_STUB_ADMIN_NEXT_ID = 10_000


def _ensure_admin_datasets() -> None:
    global _STUB_ADMIN_NEXT_ID
    if _STUB_ADMIN_DATASETS:
        return
    _STUB_ADMIN_DATASETS.extend(catalog_stub.list_all_datasets())
    _STUB_ADMIN_NEXT_ID = max(dataset.id for dataset in _STUB_ADMIN_DATASETS) + 1


def admin_list_datasets() -> AdminDatasetListResponse:
    _ensure_admin_datasets()
    summaries = [
        DatasetSummaryResponse(**dataset.model_dump(exclude={"created_at", "updated_at"}))
        for dataset in _STUB_ADMIN_DATASETS
    ]
    return AdminDatasetListResponse(total=len(summaries), datasets=summaries)


def admin_get_dataset(dataset_id: int) -> DatasetDetailResponse:
    _ensure_admin_datasets()
    for dataset in _STUB_ADMIN_DATASETS:
        if dataset.id == dataset_id:
            return dataset
    raise LookupError("Dataset introuvable")


def admin_create_dataset(payload: AdminDatasetCreateRequest) -> DatasetDetailResponse:
    global _STUB_ADMIN_NEXT_ID
    _ensure_admin_datasets()

    dataset = DatasetDetailResponse(
        id=_STUB_ADMIN_NEXT_ID,
        external_id=payload.external_id or f"manual/{_STUB_ADMIN_NEXT_ID}",
        title=payload.title,
        description=payload.description or "inconnu",
        language=LanguageResponse(code=payload.language[:3], name=payload.language, family="inconnu", region="inconnu"),
        language_raw=payload.language_raw or payload.language,
        source=SourceResponse(slug=payload.source_slug, name=payload.source_name or payload.source_slug, base_url="inconnu"),
        license=(
            LicenseResponse(
                name=payload.license_name,
                spdx_id=payload.license_spdx_id,
                url=payload.license_url or "inconnu",
            )
            if payload.license_name
            else None
        ),
        provenance=payload.provenance.value,
        data_format=payload.data_format or "inconnu",
        size=payload.size or "inconnu",
        source_url=payload.source_url,
        tasks=[TaskResponse(code=payload.task, label=payload.task.upper())],
        published_at=payload.published_at,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    _STUB_ADMIN_NEXT_ID += 1
    _STUB_ADMIN_DATASETS.append(dataset)
    return dataset


def admin_update_dataset(dataset_id: int, payload: AdminDatasetUpdateRequest) -> DatasetDetailResponse:
    """PATCH partiel : seuls les champs transmis sont réécrits (contrat Story 4.1)."""
    _ensure_admin_datasets()
    for index, dataset in enumerate(_STUB_ADMIN_DATASETS):
        if dataset.id != dataset_id:
            continue

        updates = payload.model_dump(exclude_unset=True)
        changes: dict = {}

        for field in ("title", "description", "source_url", "language_raw", "data_format", "size"):
            if field in updates and updates[field] is not None:
                changes[field] = updates[field]

        if updates.get("provenance") is not None:
            changes["provenance"] = updates["provenance"].value

        if updates.get("language") is not None:
            language = updates["language"]
            changes["language"] = LanguageResponse(
                code=language[:3],
                name=updates.get("language_raw") or language,
                family=dataset.language.family,
                region=dataset.language.region,
            )

        if updates.get("task") is not None:
            task = updates["task"]
            changes["tasks"] = [TaskResponse(code=task, label=task.upper())]

        if updates.get("source_slug") is not None or updates.get("source_name") is not None:
            slug = updates.get("source_slug") or dataset.source.slug
            changes["source"] = SourceResponse(
                slug=slug,
                name=updates.get("source_name") or slug,
                base_url=dataset.source.base_url,
            )

        if any(updates.get(field) is not None for field in ("license_name", "license_spdx_id", "license_url")):
            changes["license"] = LicenseResponse(
                name=updates.get("license_name") or (dataset.license.name if dataset.license else "inconnu"),
                spdx_id=updates.get("license_spdx_id")
                or (dataset.license.spdx_id if dataset.license else None),
                url=updates.get("license_url") or (dataset.license.url if dataset.license else "inconnu"),
            )

        changes["updated_at"] = datetime.now(timezone.utc)
        dataset = dataset.model_copy(update=changes)
        _STUB_ADMIN_DATASETS[index] = dataset
        return dataset
    raise LookupError("Dataset introuvable")


def admin_delete_dataset(dataset_id: int) -> MessageResponse:
    _ensure_admin_datasets()
    for index, dataset in enumerate(_STUB_ADMIN_DATASETS):
        if dataset.id == dataset_id:
            _STUB_ADMIN_DATASETS.pop(index)
            return MessageResponse(detail="Dataset supprimé")
    raise LookupError("Dataset introuvable")
