from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.models import Dataset, DatasetTaskLink


class AdminDatasetRepository:
    """Opérations d'administration sur les datasets partagés (FR-19)."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def delete_dataset(self, dataset_id: int) -> bool:
        dataset = self.session.get(Dataset, dataset_id)
        if dataset is None:
            return False

        links = self.session.exec(
            select(DatasetTaskLink).where(DatasetTaskLink.dataset_id == dataset_id)
        ).all()
        for link in links:
            self.session.delete(link)

        self._delete_dataset_fts(dataset_id)
        self.session.delete(dataset)
        self.session.commit()
        return True

    def set_contributor(self, dataset_id: int, contributor_account_id: int | None) -> None:
        dataset = self.session.get(Dataset, dataset_id)
        if dataset is None:
            return
        dataset.contributor_account_id = contributor_account_id
        self.session.add(dataset)
        self.session.commit()

    def load_dataset(self, dataset_id: int) -> Dataset | None:
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

    def _delete_dataset_fts(self, dataset_id: int) -> None:
        if self.session.bind is None or self.session.bind.dialect.name != "sqlite":
            return
        self.session.execute(
            text("DELETE FROM dataset_fts WHERE dataset_id = :dataset_id"),
            {"dataset_id": dataset_id},
        )
