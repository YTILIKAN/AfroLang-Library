from sqlalchemy import text
from sqlalchemy.engine import Engine


def init_fts5(engine: Engine) -> None:
    """Initialise la table virtuelle FTS5 pour la recherche plein texte sur les métadonnées."""
    if engine.dialect.name != "sqlite":
        return

    with engine.connect() as connection:
        connection.execute(
            text(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS dataset_fts USING fts5(
                    dataset_id UNINDEXED,
                    title,
                    description,
                    language_code,
                    language_raw,
                    tokenize = 'unicode61'
                )
                """
            )
        )
        connection.commit()
