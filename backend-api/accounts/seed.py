from sqlmodel import Session, select

from accounts.auth import hash_password
from accounts.repository import AccountsRepository
from core.config import Settings
from core.models import Account, AccountRole


def seed_admin_if_missing(session: Session, settings: Settings) -> bool:
    """Crée un compte admin initial si aucun administrateur n'existe encore."""
    if settings.accounts_stub:
        return False

    existing_admin = session.exec(
        select(Account).where(Account.role == AccountRole.ADMIN)
    ).first()
    if existing_admin is not None:
        return False

    repository = AccountsRepository(session)
    if repository.get_account_by_email(settings.admin_seed_email) is not None:
        return False

    repository.create_account(
        email=settings.admin_seed_email,
        display_name=settings.admin_seed_display_name,
        password_hash=hash_password(settings.admin_seed_password),
        role=AccountRole.ADMIN,
    )
    return True
