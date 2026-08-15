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


def search_datasets(session: Session, query: str, *, limit: int = 50) -> list[Dataset]:
    """Recherche plein texte — FTS5 (SQLite) ou ILIKE (PostgreSQL et autres)."""
    trimmed = query.strip()
    if not trimmed:
        return []

    dialect = session.bind.dialect.name if session.bind is not None else "sqlite"

    if dialect == "sqlite":
        rows = session.execute(
            text(
                """
                SELECT dataset_id
                FROM dataset_fts
                WHERE dataset_fts MATCH :query
                LIMIT :limit
                """
            ),
            {"query": trimmed, "limit": limit},
        ).all()
        dataset_ids = [row[0] for row in rows]
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

    pattern = f"%{trimmed}%"
    statement = (
        select(Dataset)
        .where(
            or_(
                Dataset.title.ilike(pattern),
                Dataset.description.ilike(pattern),
                Dataset.language_code.ilike(pattern),
                Dataset.language_raw.ilike(pattern),
            )
        )
        .options(*_dataset_load_options())
        .limit(limit)
    )
    return list(session.exec(statement).all())
