from sqlmodel import Session

from core.models import Dataset
from core.schemas import DatasetInput
from ingestion.repository import IngestionRepository


class IngestionService:
    """Orchestration de l'ingestion — délègue toute persistance au repository."""

    def __init__(self, session: Session) -> None:
        self.repository = IngestionRepository(session)

    def persist_dataset(self, payload: DatasetInput) -> Dataset:
        return self.repository.save_dataset(payload)
