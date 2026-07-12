from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.models import Dataset, Language, Source


class CatalogRepository:
    """Lecture du catalogue via l'ORM — aucun SQL métier en dehors de FTS5."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_dataset_by_id(self, dataset_id: int) -> Dataset | None:
        statement = (
            select(Dataset)
            .where(Dataset.id == dataset_id)
            .options(
                selectinload(Dataset.source),
                selectinload(Dataset.language),
                selectinload(Dataset.license),
                selectinload(Dataset.tasks),
            )
        )
        return self.session.exec(statement).first()

    def get_dataset_by_source_external_id(self, source_slug: str, external_id: str) -> Dataset | None:
        statement = (
            select(Dataset)
            .join(Source)
            .where(Source.slug == source_slug, Dataset.external_id == external_id)
        )
        return self.session.exec(statement).first()

    def list_datasets_by_language(self, language_code: str) -> list[Dataset]:
        statement = select(Dataset).where(Dataset.language_code == language_code)
        return list(self.session.exec(statement).all())

    def get_language(self, code: str) -> Language | None:
        return self.session.get(Language, code)

    def list_languages(self) -> list[Language]:
        return list(self.session.exec(select(Language)).all())

    def search_datasets(self, query: str, *, limit: int = 50) -> list[Dataset]:
        if self.session.bind is not None and self.session.bind.dialect.name != "sqlite":
            statement = select(Dataset).where(
                Dataset.title.contains(query) | Dataset.description.contains(query)
            )
            return list(self.session.exec(statement.limit(limit)).all())

        rows = self.session.execute(
            text(
                """
                SELECT dataset_id
                FROM dataset_fts
                WHERE dataset_fts MATCH :query
                LIMIT :limit
                """
            ),
            {"query": query, "limit": limit},
        ).all()
        dataset_ids = [row[0] for row in rows]
        if not dataset_ids:
            return []

        statement = select(Dataset).where(Dataset.id.in_(dataset_ids))
        datasets = list(self.session.exec(statement).all())
        order = {dataset_id: index for index, dataset_id in enumerate(dataset_ids)}
        datasets.sort(key=lambda dataset: order.get(dataset.id, 0))
        return datasets
