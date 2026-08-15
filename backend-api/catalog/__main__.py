"""Commande : python -m catalog.seed"""

from sqlmodel import Session

from catalog.seed import seed_catalog_if_empty
from core.database import get_engine, init_db


def main() -> None:
    init_db()
    with Session(get_engine()) as session:
        inserted = seed_catalog_if_empty(session)
        print(f"Seed : {inserted} dataset(s) inséré(s) (0 = index déjà peuplé).")


if __name__ == "__main__":
    main()
