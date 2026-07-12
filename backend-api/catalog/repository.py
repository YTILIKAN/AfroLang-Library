from sqlmodel import Session


class CatalogRepository:
    """Accès aux données du catalogue via l'ORM."""

    def __init__(self, session: Session) -> None:
        self.session = session
