"""Aligne une base SQLite locale sur le schéma courant, sans perdre les données ingérées.

`SQLModel.metadata.create_all` crée les tables manquantes mais n'ajoute jamais une colonne à une
table existante. Une base créée avant une story qui enrichit un modèle reste donc en arrière et
fait échouer les requêtes (`no such column: ...`).

Ce script comble l'écart de façon idempotente : il ajoute les colonnes manquantes connues, puis
laisse `init_db()` créer les tables absentes. À relancer après un `git pull` qui touche aux
modèles.

    cd backend-api
    ./.venv/Scripts/python.exe -m scripts.migrate_local_db          # Windows
    python -m scripts.migrate_local_db                              # Linux / macOS
"""

import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.config import get_settings  # noqa: E402
from core.database import init_db  # noqa: E402

SQLITE_PREFIX = "sqlite:///"

# Colonnes ajoutées aux modèles après la création initiale de la base.
# (table, colonne, définition SQL, index à créer ou None)
ADDED_COLUMNS: list[tuple[str, str, str, str | None]] = [
    # Story 3.2 — rattachement d'un dataset au compte qui l'a contribué.
    (
        "dataset",
        "contributor_account_id",
        "INTEGER",
        "ix_dataset_contributor_account_id",
    ),
]


def resolve_db_path() -> Path:
    url = get_settings().database_url
    if not url.startswith(SQLITE_PREFIX):
        raise SystemExit(f"Ce script ne gère que SQLite (database_url = {url}).")
    return Path(url[len(SQLITE_PREFIX) :]).resolve()


def backup(db_path: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    destination = db_path.with_suffix(f".db.bak-{stamp}")
    shutil.copy2(db_path, destination)
    return destination


def existing_columns(connection: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}


def table_exists(connection: sqlite3.Connection, table: str) -> bool:
    query = "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?"
    return connection.execute(query, (table,)).fetchone() is not None


def add_missing_columns(db_path: Path) -> int:
    added = 0
    with sqlite3.connect(db_path) as connection:
        for table, column, definition, index_name in ADDED_COLUMNS:
            if not table_exists(connection, table):
                print(f"  - {table}.{column} : table absente, sera créée par init_db()")
                continue
            if column in existing_columns(connection, table):
                print(f"  - {table}.{column} : déjà présente")
                continue

            connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
            if index_name:
                connection.execute(
                    f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({column})"
                )
            print(f"  + {table}.{column} : ajoutée")
            added += 1
        connection.commit()
    return added


def main() -> None:
    db_path = resolve_db_path()
    if not db_path.exists():
        print(f"Aucune base à migrer ({db_path}) — init_db() la créera au démarrage.")
        return

    print(f"Base : {db_path}")
    print(f"Sauvegarde : {backup(db_path)}")

    print("Colonnes :")
    added = add_missing_columns(db_path)

    print("Tables manquantes : délégué à init_db()")
    init_db()

    print(f"Terminé — {added} colonne(s) ajoutée(s).")


if __name__ == "__main__":
    main()
