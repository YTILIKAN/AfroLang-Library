"""Modèles privés au module ingestion (Story 1.2+)."""

from datetime import datetime

from sqlmodel import Field, SQLModel

from core.models import utc_now


class SyncLog(SQLModel, table=True):
    """Trace d'une exécution d'ingestion pour une source — observabilité (AD-13, Story 1.10)."""

    __tablename__ = "sync_log"

    id: int | None = Field(default=None, primary_key=True)
    source_slug: str = Field(index=True)
    started_at: datetime = Field(default_factory=utc_now)
    finished_at: datetime = Field(default_factory=utc_now)
    added_count: int = 0
    removed_count: int = 0
    errors: str = ""
    success: bool = True
