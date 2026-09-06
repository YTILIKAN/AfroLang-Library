from fastapi import HTTPException, status
from sqlmodel import Session

from accounts.api_schemas import AccountResponse, AdminAccountCreateRequest, AdminAccountUpdateRequest
from accounts.auth import hash_password
from accounts.repository import AccountsRepository
from accounts.service import account_to_response
from core.models import Account, AccountRole, utc_now


class AdminAccountService:
    """Gestion des comptes utilisateurs — réservée au rôle Admin (FR-20, AD-14)."""

    def __init__(self, session: Session) -> None:
        self.repository = AccountsRepository(session)

    def list_accounts(self) -> tuple[int, list[AccountResponse]]:
        accounts = self.repository.list_accounts()
        return len(accounts), [account_to_response(account) for account in accounts]

    def get_account(self, account_id: int) -> AccountResponse:
        account = self.repository.get_account_by_id(account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte introuvable")
        return account_to_response(account)

    def create_account(self, payload: AdminAccountCreateRequest) -> AccountResponse:
        if self.repository.get_account_by_email(payload.email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet e-mail",
            )
        account = self.repository.create_account(
            email=payload.email,
            display_name=payload.display_name,
            password_hash=hash_password(payload.password),
            role=payload.role,
        )
        return account_to_response(account)

    def update_account(
        self,
        account_id: int,
        payload: AdminAccountUpdateRequest,
        *,
        acting_admin: Account,
    ) -> AccountResponse:
        account = self.repository.get_account_by_id(account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte introuvable")

        if payload.is_active is False and account.id == acting_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un admin ne peut pas désactiver son propre compte",
            )

        if account.is_super_admin and account.id != acting_admin.id:
            # Le super admin ne peut être ni désactivé ni rétrogradé par un autre compte.
            # Il reste libre de modifier ses propres informations : la protection tient au
            # drapeau porté par la ligne, pas à son e-mail.
            if payload.is_active is False:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Le compte super admin ne peut pas être désactivé",
                )
            if payload.role is not None and payload.role != account.role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Le rôle du compte super admin ne peut pas être modifié",
                )

        if account.is_super_admin and payload.role is not None and payload.role != AccountRole.ADMIN:
            # Vaut aussi pour le super admin agissant sur lui-même : se rétrograder
            # laisserait l'instance sans administrateur protégé.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Le compte super admin doit conserver le rôle admin",
            )

        if (
            account.id == acting_admin.id
            and payload.role is not None
            and payload.role != account.role
        ):
            # Se rétrograder passait : le PATCH réussissait, puis tout appel admin suivant
            # tombait en 403 alors que l'interface, dont la session est chargée au montage,
            # continuait d'afficher le panneau. Un rôle se change par un autre admin.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Un admin ne peut pas modifier son propre rôle",
            )

        updated = self.repository.update_account(
            account,
            display_name=payload.display_name,
            role=payload.role,
            is_active=payload.is_active,
        )
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte introuvable")

        if payload.is_active is False:
            self.repository.delete_sessions_for_account(account_id)

        return account_to_response(updated)
