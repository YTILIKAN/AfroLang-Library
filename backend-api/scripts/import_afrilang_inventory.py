"""Importe les datasets de l'inventaire Afrilang.pdf dans la base.

Usage :
    cd backend-api
    .\\.venv\\Scripts\\python.exe -m scripts.import_afrilang_inventory

Pour une base locale :
    set DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/afriland
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session  # noqa: E402

from catalog.afrilang_inventory import afrilang_records, seed_afrilang_inventory  # noqa: E402
from core.database import get_engine, init_db  # noqa: E402


def main() -> None:
    total = len(afrilang_records())
    print(f"Inventaire Afrilang : {total} dataset(s) à synchroniser…")
    init_db()
    with Session(get_engine()) as session:
        created, updated = seed_afrilang_inventory(session)
        session.commit()
    print(f"Terminé — {created} créé(s), {updated} mis à jour.")


if __name__ == "__main__":
    main()
