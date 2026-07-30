from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from accounts.admin_account_service import AdminAccountService
from accounts.admin_service import AdminDatasetService
from accounts.contributor_service import ContributorDatasetService
from accounts import stub as accounts_stub
from accounts.api_schemas import (
    AccountResponse,
    AdminAccountCreateRequest,
    AdminAccountUpdateRequest,
    AdminAccountsResponse,
    AdminDatasetCreateRequest,
    AdminDatasetListResponse,
    AdminDatasetUpdateRequest,
    LoginRequest,
    MessageResponse,
    MyDatasetsResponse,
    RegisterRequest,
    SubmitDatasetRequest,
    TokenResponse,
    UpdateDatasetRequest,
)
from catalog.api_schemas import DatasetDetailResponse
from accounts.service import AccountsService
from core.config import Settings, get_settings
from core.database import get_session
from core.models import Account, AccountRole

router = APIRouter(prefix="/accounts", tags=["accounts"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_accounts_service(
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AccountsService:
    return AccountsService(session, settings)


def _extract_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_account(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: Settings = Depends(get_settings),
    service: AccountsService = Depends(get_accounts_service),
) -> Account:
    token = _extract_token(credentials)
    if settings.accounts_stub:
        try:
            stub_account = accounts_stub.resolve_account(token)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
        return Account(
            id=stub_account.id,
            email=stub_account.email,
            display_name=stub_account.display_name,
            role=stub_account.role,
            is_active=stub_account.is_active,
            password_hash="stub",
            created_at=stub_account.created_at,
            updated_at=stub_account.created_at,
        )
    return service.resolve_account_from_token(token)


def require_admin_account(
    account: Account = Depends(get_current_account),
    service: AccountsService = Depends(get_accounts_service),
) -> Account:
    service.require_role(account, AccountRole.ADMIN)
    return account


def get_admin_dataset_service(session: Session = Depends(get_session)) -> AdminDatasetService:
    return AdminDatasetService(session)


def get_admin_account_service(session: Session = Depends(get_session)) -> AdminAccountService:
    return AdminAccountService(session)


def get_contributor_dataset_service(session: Session = Depends(get_session)) -> ContributorDatasetService:
    return ContributorDatasetService(session)


@router.post(
    "/auth/register",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un compte",
    description="Inscription d'un nouveau Chercheur (FR-16). Consultation publique inchangée (AD-10).",
)
def register(
    payload: RegisterRequest,
    settings: Settings = Depends(get_settings),
    service: AccountsService = Depends(get_accounts_service),
) -> AccountResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.register(payload.email, payload.display_name, payload.password)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return service.register(
        email=payload.email,
        display_name=payload.display_name,
        password=payload.password,
    )


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Se connecter",
    description="Authentification par e-mail et mot de passe — retourne un jeton Bearer (FR-16).",
)
def login(
    payload: LoginRequest,
    settings: Settings = Depends(get_settings),
    service: AccountsService = Depends(get_accounts_service),
) -> TokenResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.login(payload.email, payload.password)
        except ValueError as exc:
            if str(exc) == "Compte désactivé":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return service.login(email=payload.email, password=payload.password)


@router.post(
    "/auth/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Se déconnecter",
    description="Invalide le jeton Bearer courant.",
)
def logout(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: Settings = Depends(get_settings),
    service: AccountsService = Depends(get_accounts_service),
) -> None:
    token = _extract_token(credentials)
    if settings.accounts_stub:
        accounts_stub.logout(token)
        return
    service.logout(token)


@router.get(
    "/me",
    response_model=AccountResponse,
    summary="Profil du compte courant",
)
def get_me(
    account: Account = Depends(get_current_account),
    service: AccountsService = Depends(get_accounts_service),
) -> AccountResponse:
    return service.get_me(account)


@router.post(
    "/datasets",
    response_model=DatasetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Soumettre un dataset",
    description="Contribution chercheur — normalisation et provenance `contribué` (FR-17, Story 3.2).",
)
def submit_dataset(
    payload: SubmitDatasetRequest,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
    contributor_service: ContributorDatasetService = Depends(get_contributor_dataset_service),
) -> DatasetDetailResponse:
    if settings.accounts_stub:
        return accounts_stub.submit_dataset(account.id, payload)
    return contributor_service.submit(account, payload)


@router.get(
    "/datasets/mine",
    response_model=MyDatasetsResponse,
    summary="Mes datasets",
    description="Liste des contributions du chercheur connecté (FR-18, Story 3.3).",
)
def list_my_datasets(
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
    contributor_service: ContributorDatasetService = Depends(get_contributor_dataset_service),
) -> MyDatasetsResponse:
    if settings.accounts_stub:
        return accounts_stub.list_my_datasets(account.id)
    total, datasets = contributor_service.list_mine(account)
    return MyDatasetsResponse(total=total, datasets=datasets)


@router.patch(
    "/datasets/{dataset_id}",
    response_model=DatasetDetailResponse,
    summary="Modifier ma contribution",
)
def update_my_dataset(
    dataset_id: int,
    payload: UpdateDatasetRequest,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
    contributor_service: ContributorDatasetService = Depends(get_contributor_dataset_service),
) -> DatasetDetailResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.update_my_dataset(account.id, dataset_id, payload.title)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return contributor_service.update_mine(account, dataset_id, payload)


@router.delete(
    "/datasets/{dataset_id}",
    response_model=MessageResponse,
    summary="Supprimer ma contribution",
)
def delete_my_dataset(
    dataset_id: int,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
    contributor_service: ContributorDatasetService = Depends(get_contributor_dataset_service),
) -> MessageResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.delete_my_dataset(account.id, dataset_id)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    contributor_service.delete_mine(account, dataset_id)
    return MessageResponse(detail="Dataset supprimé")


@router.get(
    "/admin/accounts",
    response_model=AdminAccountsResponse,
    summary="Lister les comptes (Admin)",
    description="Gestion des comptes — Story 4.2 (FR-20).",
)
def admin_list_accounts(
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_account_service: AdminAccountService = Depends(get_admin_account_service),
) -> AdminAccountsResponse:
    if settings.accounts_stub:
        return accounts_stub.admin_list_accounts()
    total, accounts = admin_account_service.list_accounts()
    return AdminAccountsResponse(total=total, accounts=accounts)


@router.get(
    "/admin/accounts/{account_id}",
    response_model=AccountResponse,
    summary="Fiche compte (Admin)",
)
def admin_get_account(
    account_id: int,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_account_service: AdminAccountService = Depends(get_admin_account_service),
) -> AccountResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_get_account(account_id)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return admin_account_service.get_account(account_id)


@router.post(
    "/admin/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un compte (Admin)",
)
def admin_create_account(
    payload: AdminAccountCreateRequest,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_account_service: AdminAccountService = Depends(get_admin_account_service),
) -> AccountResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_create_account(payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return admin_account_service.create_account(payload)


@router.patch(
    "/admin/accounts/{account_id}",
    response_model=AccountResponse,
    summary="Modifier ou désactiver un compte (Admin)",
)
def admin_update_account(
    account_id: int,
    payload: AdminAccountUpdateRequest,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_account_service: AdminAccountService = Depends(get_admin_account_service),
) -> AccountResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_update_account(account_id, payload)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return admin_account_service.update_account(account_id, payload, acting_admin=account)


@router.get(
    "/admin/datasets",
    response_model=AdminDatasetListResponse,
    summary="Lister tous les datasets (Admin)",
    description="Vue globale de l'index — toutes origines (FR-19, Story 4.1).",
)
def admin_list_datasets(
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_service: AdminDatasetService = Depends(get_admin_dataset_service),
) -> AdminDatasetListResponse:
    if settings.accounts_stub:
        return accounts_stub.admin_list_datasets()
    total, datasets = admin_service.list_datasets()
    return AdminDatasetListResponse(total=total, datasets=datasets)


@router.get(
    "/admin/datasets/{dataset_id}",
    response_model=DatasetDetailResponse,
    summary="Fiche dataset (Admin)",
)
def admin_get_dataset(
    dataset_id: int,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_service: AdminDatasetService = Depends(get_admin_dataset_service),
) -> DatasetDetailResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_get_dataset(dataset_id)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return admin_service.get_dataset(dataset_id)


@router.post(
    "/admin/datasets",
    response_model=DatasetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter un dataset (Admin)",
)
def admin_create_dataset(
    payload: AdminDatasetCreateRequest,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_service: AdminDatasetService = Depends(get_admin_dataset_service),
) -> DatasetDetailResponse:
    if settings.accounts_stub:
        return accounts_stub.admin_create_dataset(payload)
    return admin_service.create_dataset(payload)


@router.patch(
    "/admin/datasets/{dataset_id}",
    response_model=DatasetDetailResponse,
    summary="Modifier un dataset (Admin)",
)
def admin_update_dataset(
    dataset_id: int,
    payload: AdminDatasetUpdateRequest,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_service: AdminDatasetService = Depends(get_admin_dataset_service),
) -> DatasetDetailResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_update_dataset(dataset_id, payload)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return admin_service.update_dataset(dataset_id, payload)


@router.delete(
    "/admin/datasets/{dataset_id}",
    response_model=MessageResponse,
    summary="Supprimer un dataset (Admin)",
)
def admin_delete_dataset(
    dataset_id: int,
    account: Account = Depends(require_admin_account),
    settings: Settings = Depends(get_settings),
    admin_service: AdminDatasetService = Depends(get_admin_dataset_service),
) -> MessageResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.admin_delete_dataset(dataset_id)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    admin_service.delete_dataset(dataset_id)
    return MessageResponse(detail="Dataset supprimé")
