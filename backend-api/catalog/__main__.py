"""Commande : python -m catalog"""

from sqlmodel import Session

from catalog.seed import seed_catalog
from core.database import get_engine, init_db


def main() -> None:
    init_db()
    with Session(get_engine()) as session:
        inserted = seed_catalog(session)
        print(f"Seed : {inserted} nouveau(x) dataset(s) (les autres sont à jour).")


if __name__ == "__main__":
    main()
