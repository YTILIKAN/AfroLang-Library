"""Modèles privés au module accounts (sessions d'authentification)."""

from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

from core.models import utc_now


class AccountSession(SQLModel, table=True):
    __tablename__ = "account_session"

    token: str = Field(primary_key=True, max_length=128)
    account_id: int = Field(foreign_key="account.id", index=True)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True)),
    )
