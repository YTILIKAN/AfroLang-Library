from sqlmodel import Session, select

from accounts.auth import hash_password
from accounts.repository import AccountsRepository
from core.config import Settings
from core.models import Account, AccountRole


def seed_admin_if_missing(session: Session, settings: Settings) -> bool:
    """Crée le compte super admin initial si aucun administrateur n'existe encore.

    L'existence est jugée sur le drapeau `is_super_admin`, pas sur `admin_seed_email` :
    le super admin peut ainsi changer ses coordonnées sans qu'un second compte soit semé
    et sans perdre sa protection.
    """
    if settings.accounts_stub:
        return False

    repository = AccountsRepository(session)
    if repository.get_super_admin() is not None:
        return False

    existing_admins = session.exec(
        select(Account).where(Account.role == AccountRole.ADMIN)
    ).all()
    if len(existing_admins) == 1:
        # Base antérieure au drapeau : on promeut l'unique admin en place plutôt que
        # d'en semer un second, sinon l'instance resterait sans super admin.
        repository.promote_super_admin(existing_admins[0])
        return True
    if existing_admins:
        # Plusieurs admins : désigner arbitrairement le premier serait un choix
        # silencieux et lourd de conséquences. L'opérateur tranche via
        # `python -m scripts.set_super_admin <email>`.
        return False

    if repository.get_account_by_email(settings.admin_seed_email) is not None:
        return False

    repository.create_account(
        email=settings.admin_seed_email,
        display_name=settings.admin_seed_display_name,
        password_hash=hash_password(settings.admin_seed_password),
        role=AccountRole.ADMIN,
        is_super_admin=True,
    )
    return True
