from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from accounts import stub as accounts_stub
from accounts.api_schemas import (
    AccountResponse,
    AdminAccountsResponse,
    LoginRequest,
    MessageResponse,
    MyDatasetsResponse,
    RegisterRequest,
    SubmitDatasetRequest,
    TokenResponse,
    UpdateDatasetRequest,
)
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
    status_code=status.HTTP_201_CREATED,
    summary="Soumettre un dataset (bouchon)",
    description="Contrat de contribution — implémentation complète en Story 3.2 (FR-17).",
)
def submit_dataset(
    payload: SubmitDatasetRequest,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
) -> dict:
    if settings.accounts_stub:
        return accounts_stub.submit_dataset(account.id, payload)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Contribution réelle disponible en Story 3.2",
    )


@router.get(
    "/datasets/mine",
    response_model=MyDatasetsResponse,
    summary="Mes datasets (bouchon)",
    description="Liste des contributions du chercheur — Story 3.3 pour l'implémentation réelle.",
)
def list_my_datasets(
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
) -> MyDatasetsResponse:
    if settings.accounts_stub:
        return accounts_stub.list_my_datasets(account.id)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Gestion des contributions disponible en Story 3.3",
    )


@router.patch(
    "/datasets/{dataset_id}",
    summary="Modifier ma contribution (bouchon)",
)
def update_my_dataset(
    dataset_id: int,
    payload: UpdateDatasetRequest,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
) -> dict:
    if settings.accounts_stub:
        try:
            return accounts_stub.update_my_dataset(account.id, dataset_id, payload.title)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Modification disponible en Story 3.3",
    )


@router.delete(
    "/datasets/{dataset_id}",
    response_model=MessageResponse,
    summary="Supprimer ma contribution (bouchon)",
)
def delete_my_dataset(
    dataset_id: int,
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
) -> MessageResponse:
    if settings.accounts_stub:
        try:
            return accounts_stub.delete_my_dataset(account.id, dataset_id)
        except LookupError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Suppression disponible en Story 3.3",
    )


@router.get(
    "/admin/accounts",
    response_model=AdminAccountsResponse,
    summary="Lister les comptes (Admin, bouchon)",
    description="Gestion des comptes — implémentation complète en Story 4.2 (FR-20).",
)
def admin_list_accounts(
    account: Account = Depends(get_current_account),
    settings: Settings = Depends(get_settings),
    service: AccountsService = Depends(get_accounts_service),
) -> AdminAccountsResponse:
    service.require_role(account, AccountRole.ADMIN)
    if settings.accounts_stub:
        return accounts_stub.admin_list_accounts()
    accounts = service.repository.list_accounts()
    return AdminAccountsResponse(
        total=len(accounts),
        accounts=[service.get_me(item) for item in accounts],
    )
