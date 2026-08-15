"""Commande : python -m accounts.seed"""

from sqlmodel import Session

from accounts.seed import seed_admin_if_missing
from core.config import get_settings
from core.database import get_engine, init_db


def main() -> None:
    settings = get_settings()
    if settings.accounts_stub:
        print("ACCOUNTS_STUB=true — aucun compte en base (mode bouchon).")
        return

    init_db()
    with Session(get_engine()) as session:
        created = seed_admin_if_missing(session, settings)
        if created:
            print(f"Admin créé : {settings.admin_seed_email}")
        else:
            print("Admin déjà présent — rien à faire.")


if __name__ == "__main__":
    main()
