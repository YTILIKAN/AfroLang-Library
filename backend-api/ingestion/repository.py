from sqlmodel import Session


class IngestionRepository:
    """Persistance des données ingérées via l'ORM."""

    def __init__(self, session: Session) -> None:
        self.session = session
