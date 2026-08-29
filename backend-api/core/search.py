from sqlalchemy import or_, text
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.models import Dataset


def _dataset_load_options():
    return (
        selectinload(Dataset.source),
        selectinload(Dataset.language),
        selectinload(Dataset.license),
        selectinload(Dataset.tasks),
    )


def _fts_match_expression(query: str) -> str:
    """Traduit une saisie libre en expression FTS5 sûre.

    Chaque mot devient une phrase entre guillemets suivie de `*` : la citation neutralise
    les opérateurs FTS5 (`OR`, `NEAR`, `-`, `:`) qu'un visiteur peut taper sans le vouloir,
    et le préfixe aligne SQLite sur le comportement `ILIKE` du chemin PostgreSQL.
    """
    tokens = [token.replace('"', "") for token in query.split()]
    return " ".join(f'"{token}"*' for token in tokens if token)


def search_dataset_ids(session: Session, query: str, *, limit: int = 50) -> list[int]:
    """Identifiants des datasets correspondant à la requête, par ordre de pertinence."""
    trimmed = query.strip()
    if not trimmed:
        return []

    dialect = session.bind.dialect.name if session.bind is not None else "sqlite"

    if dialect == "sqlite":
        match_expression = _fts_match_expression(trimmed)
        if not match_expression:
            return []

        rows = session.execute(
            text(
                """
                SELECT dataset_id
                FROM dataset_fts
                WHERE dataset_fts MATCH :query
                LIMIT :limit
                """
            ),
            {"query": match_expression, "limit": limit},
        ).all()
        return [row[0] for row in rows]

    pattern = f"%{trimmed}%"
    statement = (
        select(Dataset.id)
        .where(
            or_(
                Dataset.title.ilike(pattern),
                Dataset.description.ilike(pattern),
                Dataset.language_code.ilike(pattern),
                Dataset.language_raw.ilike(pattern),
            )
        )
        .limit(limit)
    )
    return list(session.exec(statement).all())


def search_datasets(session: Session, query: str, *, limit: int = 50) -> list[Dataset]:
    """Recherche plein texte — FTS5 (SQLite) ou ILIKE (PostgreSQL et autres)."""
    dataset_ids = search_dataset_ids(session, query, limit=limit)
    if not dataset_ids:
        return []

    statement = (
        select(Dataset)
        .where(Dataset.id.in_(dataset_ids))
        .options(*_dataset_load_options())
    )
    datasets = list(session.exec(statement).all())
    order = {dataset_id: index for index, dataset_id in enumerate(dataset_ids)}
    datasets.sort(key=lambda dataset: order.get(dataset.id, 0))
    return datasets
