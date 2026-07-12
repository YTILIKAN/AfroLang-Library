from sqlmodel import Session

from core.models import Dataset
from core.schemas import DatasetInput
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.normalization import NormalizationResult, normalize_dataset_metadata
from ingestion.repository import IngestionRepository


class IngestionService:
    """Orchestration de l'ingestion — délègue toute persistance au repository."""

    def __init__(self, session: Session) -> None:
        self.repository = IngestionRepository(session)

    def normalize_raw_dataset(
        self,
        raw: RawDatasetMetadata,
        *,
        language_code: str | None = None,
        language_name: str | None = None,
    ) -> NormalizationResult:
        return normalize_dataset_metadata(
            raw,
            language_code=language_code,
            language_name=language_name,
        )

    def persist_dataset(self, payload: DatasetInput) -> Dataset:
        return self.repository.save_dataset(payload)
