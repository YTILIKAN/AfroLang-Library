from datetime import datetime, timezone

from sqlmodel import Session, select

from accounts.auth import as_utc
from accounts.models import AccountSession
from core.models import Account, AccountRole


class AccountsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_account_by_email(self, email: str) -> Account | None:
        normalized = email.strip().lower()
        statement = select(Account).where(Account.email == normalized)
        return self.session.exec(statement).first()

    def get_account_by_id(self, account_id: int) -> Account | None:
        return self.session.get(Account, account_id)

    def create_account(
        self,
        *,
        email: str,
        display_name: str,
        password_hash: str,
        role: AccountRole = AccountRole.CHERCHEUR,
    ) -> Account:
        account = Account(
            email=email.strip().lower(),
            display_name=display_name.strip(),
            password_hash=password_hash,
            role=role,
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

    def list_accounts(self) -> list[Account]:
        statement = select(Account).order_by(Account.created_at)
        return list(self.session.exec(statement).all())
