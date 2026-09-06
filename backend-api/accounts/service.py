from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session

from accounts.api_schemas import AccountResponse, TokenResponse
from accounts.auth import generate_session_token, hash_password, as_utc, session_expires_at, verify_password
from accounts.repository import AccountsRepository
from core.config import Settings
from core.models import Account, AccountRole


def account_to_response(account: Account) -> AccountResponse:
    return AccountResponse(
        id=account.id,
        email=account.email,
        display_name=account.display_name,
        role=account.role,
        is_active=account.is_active,
        is_super_admin=account.is_super_admin,
        created_at=account.created_at,
    )


class AccountsService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.repository = AccountsRepository(session)

    def register(self, *, email: str, display_name: str, password: str) -> AccountResponse:
        if self.repository.get_account_by_email(email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet e-mail",
            )
        account = self.repository.create_account(
            email=email,
            display_name=display_name,
            password_hash=hash_password(password),
        )
        return account_to_response(account)

    def login(self, *, email: str, password: str) -> TokenResponse:
        account = self.repository.get_account_by_email(email)
        if account is None or not verify_password(password, account.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiants invalides",
            )
        if not account.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte désactivé",
            )

        self.repository.delete_expired_sessions()
        token = generate_session_token()
        expires_at = session_expires_at(self.settings)
        self.repository.create_session(account_id=account.id, token=token, expires_at=expires_at)
        return TokenResponse(
            access_token=token,
            expires_at=expires_at,
            account=account_to_response(account),
        )

    def logout(self, token: str) -> None:
        self.repository.delete_session(token)

    def resolve_account_from_token(self, token: str) -> Account:
        session_row = self.repository.get_session(token)
        if session_row is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session invalide ou expirée",
            )
        if as_utc(session_row.expires_at) <= datetime.now(timezone.utc):
            self.repository.delete_session(token)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expirée",
            )

        account = self.repository.get_account_by_id(session_row.account_id)
        if account is None or not account.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Compte indisponible",
            )
        return account

    def get_me(self, account: Account) -> AccountResponse:
        return account_to_response(account)

    def require_role(self, account: Account, *roles: AccountRole) -> None:
        if account.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé pour ce rôle",
            )
