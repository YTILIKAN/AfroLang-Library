"""Désigne le compte super admin — hors API, volontairement.

Le drapeau `is_super_admin` n'est modifiable par aucune requête HTTP : un endpoint de
transfert rouvrirait exactement la surface d'attaque que le drapeau ferme (un admin
compromis transférerait le statut, puis désactiverait l'ancien super admin). Le transfert
passe donc par une commande locale, qui suppose un accès à la machine et à la base.

Le compte visé est promu au rôle admin, réactivé si besoin, et l'ancien super admin perd
le drapeau dans la même transaction — il reste admin ordinaire.

    cd backend-api
    ./.venv/Scripts/python.exe -m scripts.set_super_admin nouvelle.adresse@exemple.org
    python -m scripts.set_super_admin nouvelle.adresse@exemple.org
    python -m scripts.set_super_admin --show
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session  # noqa: E402

from accounts.repository import AccountsRepository  # noqa: E402
from core.database import get_engine  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Désigne ou affiche le compte super admin.")
    parser.add_argument("email", nargs="?", help="E-mail du compte à promouvoir.")
    parser.add_argument(
        "--show",
        action="store_true",
        help="Affiche le super admin courant sans rien modifier.",
    )
    args = parser.parse_args()

    if not args.show and not args.email:
        parser.error("Fournir un e-mail à promouvoir, ou --show.")

    with Session(get_engine()) as session:
        repository = AccountsRepository(session)
        current = repository.get_super_admin()

        if args.show:
            if current is None:
                print("Aucun super admin défini.")
            else:
                print(f"Super admin : {current.email} (id={current.id})")
            return

        target = repository.get_account_by_email(args.email)
        if target is None:
            raise SystemExit(f"Aucun compte avec l'e-mail {args.email}.")

        if current is not None and current.id == target.id:
            print(f"{target.email} est déjà super admin — rien à faire.")
            return

        promoted = repository.promote_super_admin(target)
        if current is not None:
            print(f"Ancien super admin : {current.email} (reste admin ordinaire)")
        print(f"Nouveau super admin : {promoted.email} (id={promoted.id})")


if __name__ == "__main__":
    main()
