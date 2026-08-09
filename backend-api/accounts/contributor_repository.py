from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.models import Dataset


class ContributorDatasetRepository:
    """Lecture et garde de propriété des contributions chercheur (FR-18, Story 3.3)."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def list_by_contributor(self, account_id: int) -> list[Dataset]:
        statement = (
            select(Dataset)
            .where(Dataset.contributor_account_id == account_id)
            .options(
                selectinload(Dataset.source),
                selectinload(Dataset.language),
                selectinload(Dataset.license),
                selectinload(Dataset.tasks),
            )
            .order_by(Dataset.title)
        )
        return list(self.session.exec(statement).all())

    def get_owned_dataset(self, dataset_id: int, account_id: int) -> Dataset | None:
        dataset = self.session.get(Dataset, dataset_id)
        if dataset is None:
            return None
        if dataset.contributor_account_id != account_id:
            return None
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
