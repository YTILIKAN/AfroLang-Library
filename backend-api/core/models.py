from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

UNKNOWN = "inconnu"


class Provenance(str, Enum):
    SYNCHRONISE = "synchronisé"
    CONTRIBUE = "contribué"
    MANUEL = "manuel"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Language(SQLModel, table=True):
    __tablename__ = "language"

    code: str = Field(primary_key=True, max_length=3, description="Code canonique ISO 639-3")
    name: str = Field(default=UNKNOWN)
    family: str = Field(default=UNKNOWN)
    region: str = Field(default=UNKNOWN)

    datasets: list["Dataset"] = Relationship(back_populates="language")


class Source(SQLModel, table=True):
    __tablename__ = "source"

    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)
    name: str
    base_url: str = Field(default=UNKNOWN)

    datasets: list["Dataset"] = Relationship(back_populates="source")


class License(SQLModel, table=True):
    __tablename__ = "license"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default=UNKNOWN)
    spdx_id: Optional[str] = Field(default=None, index=True)
    url: str = Field(default=UNKNOWN)

    datasets: list["Dataset"] = Relationship(back_populates="license")


class DatasetTaskLink(SQLModel, table=True):
    __tablename__ = "dataset_task_link"

    dataset_id: int = Field(foreign_key="dataset.id", primary_key=True)
    task_id: int = Field(foreign_key="task.id", primary_key=True)


class Task(SQLModel, table=True):
    __tablename__ = "task"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    label: str

    datasets: list["Dataset"] = Relationship(back_populates="tasks", link_model=DatasetTaskLink)


class Dataset(SQLModel, table=True):
    __tablename__ = "dataset"
    __table_args__ = (UniqueConstraint("source_id", "external_id", name="uq_dataset_source_external"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True, description="Identifiant sur la plateforme source")
    title: str
    description: str = Field(default=UNKNOWN)
    source_id: int = Field(foreign_key="source.id", index=True)
    language_code: str = Field(foreign_key="language.code", index=True)
    language_raw: str = Field(default=UNKNOWN, description="Valeur brute d'origine pour traçabilité")
    license_id: Optional[int] = Field(default=None, foreign_key="license.id")
    provenance: Provenance = Field(index=True)
    data_format: str = Field(default=UNKNOWN)
    size: str = Field(default=UNKNOWN)
    source_url: str = Field(description="Lien de redirection vers la source — jamais le contenu du dataset")
    published_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True)),
    )

    source: Source = Relationship(back_populates="datasets")
    language: Language = Relationship(back_populates="datasets")
    license: Optional[License] = Relationship(back_populates="datasets")
    tasks: list[Task] = Relationship(back_populates="datasets", link_model=DatasetTaskLink)
