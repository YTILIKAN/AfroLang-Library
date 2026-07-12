from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from core.models import Provenance, UNKNOWN


class LanguageInput(BaseModel):
    code: str = Field(min_length=3, max_length=3)
    name: str = UNKNOWN
    family: str = UNKNOWN
    region: str = UNKNOWN


class SourceInput(BaseModel):
    slug: str
    name: str
    base_url: str = UNKNOWN


class TaskInput(BaseModel):
    code: str
    label: str


class LicenseInput(BaseModel):
    name: str = UNKNOWN
    spdx_id: str | None = None
    url: str = UNKNOWN


class DatasetInput(BaseModel):
    external_id: str
    title: str
    source: SourceInput
    language: LanguageInput
    language_raw: str
    provenance: Provenance
    source_url: HttpUrl | str
    description: str = UNKNOWN
    license: LicenseInput | None = None
    data_format: str = UNKNOWN
    size: str = UNKNOWN
    task_codes: list[str] = Field(default_factory=list)
    task_tags_raw: str = UNKNOWN
    published_at: datetime | None = None
