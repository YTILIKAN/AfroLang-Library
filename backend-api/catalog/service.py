from sqlmodel import Session

from catalog.repository import CatalogRepository


class CatalogService:
    """Logique métier du catalogue."""

    def __init__(self, session: Session) -> None:
        self.repository = CatalogRepository(session)
