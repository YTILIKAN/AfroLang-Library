from sqlmodel import Session

from ingestion.repository import IngestionRepository


class IngestionService:
    """Orchestration des connecteurs et de la normalisation."""

    def __init__(self, session: Session) -> None:
        self.repository = IngestionRepository(session)
