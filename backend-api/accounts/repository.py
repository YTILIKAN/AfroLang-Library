from datetime import datetime, timezone

from sqlmodel import Session, select

from accounts.auth import as_utc
from accounts.models import AccountSession
from core.models import Account, AccountRole, utc_now


class AccountsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_account_by_email(self, email: str) -> Account | None:
        normalized = email.strip().lower()
        statement = select(Account).where(Account.email == normalized)
        return self.session.exec(statement).first()

    def get_account_by_id(self, account_id: int) -> Account | None:
        return self.session.get(Account, account_id)

    def get_super_admin(self) -> Account | None:
        """Le super admin est identifié par son drapeau, jamais par son e-mail."""
        statement = select(Account).where(Account.is_super_admin == True)  # noqa: E712
        return self.session.exec(statement).first()

    def create_account(
        self,
        *,
        email: str,
        display_name: str,
        password_hash: str,
        role: AccountRole = AccountRole.CHERCHEUR,
        is_super_admin: bool = False,
    ) -> Account:
        account = Account(
            email=email.strip().lower(),
            display_name=display_name.strip(),
            password_hash=password_hash,
            role=role,
            is_super_admin=is_super_admin,
        )
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)
        return account

    def create_session(self, *, account_id: int, token: str, expires_at: datetime) -> AccountSession:
        session_row = AccountSession(token=token, account_id=account_id, expires_at=expires_at)
        self.session.add(session_row)
        self.session.commit()
        self.session.refresh(session_row)
        return session_row

    def get_session(self, token: str) -> AccountSession | None:
        return self.session.get(AccountSession, token)

    def delete_session(self, token: str) -> None:
        session_row = self.session.get(AccountSession, token)
        if session_row is not None:
            self.session.delete(session_row)
            self.session.commit()

    def delete_expired_sessions(self) -> None:
        now = datetime.now(timezone.utc)
        statement = select(AccountSession).where(AccountSession.expires_at <= now)
        for row in self.session.exec(statement).all():
            if as_utc(row.expires_at) <= now:
                self.session.delete(row)
        self.session.commit()

    def update_account(
        self,
        account: Account,
        *,
        display_name: str | None = None,
        role: AccountRole | None = None,
        is_active: bool | None = None,
    ) -> Account | None:
        """Mise à jour depuis l'API. `is_super_admin` n'est pas un paramètre : le drapeau
        n'est atteignable que par `promote_super_admin`, hors chemin HTTP."""
        if display_name is not None:
            account.display_name = display_name.strip()
        if role is not None:
            account.role = role
        if is_active is not None:
            account.is_active = is_active
        account.updated_at = utc_now()
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)
        return account

    def delete_sessions_for_account(self, account_id: int) -> None:
        statement = select(AccountSession).where(AccountSession.account_id == account_id)
        for row in self.session.exec(statement).all():
            self.session.delete(row)
        self.session.commit()

    def promote_super_admin(self, account: Account) -> Account:
        """Transfère le statut de super admin — réservé aux scripts d'administration.

        Aucune route n'appelle cette méthode : un endpoint de transfert rouvrirait la
        surface d'attaque que le drapeau ferme. L'unicité est garantie ici en retirant
        le drapeau au détenteur précédent dans la même transaction.
        """
        for previous in self.session.exec(
            select(Account).where(Account.is_super_admin == True)  # noqa: E712
        ).all():
            if previous.id == account.id:
                continue
            previous.is_super_admin = False
            previous.updated_at = utc_now()
            self.session.add(previous)

        account.is_super_admin = True
        account.role = AccountRole.ADMIN
        account.is_active = True
        account.updated_at = utc_now()
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)
        return account

    def list_accounts(self) -> list[Account]:
        statement = select(Account).order_by(Account.created_at)
        return list(self.session.exec(statement).all())
