from datetime import datetime

from pydantic import BaseModel, Field


class LanguageResponse(BaseModel):
    code: str = Field(description="Code canonique ISO 639-3")
    name: str
    family: str
    region: str


class SourceResponse(BaseModel):
    slug: str
    name: str
    base_url: str


class TaskResponse(BaseModel):
    code: str
    label: str


class LicenseResponse(BaseModel):
    name: str
    spdx_id: str | None = None
    url: str


class DatasetSummaryResponse(BaseModel):
    """Forme JSON d'un dataset dans les résultats de recherche."""

    id: int
    external_id: str
    title: str
    description: str
    language: LanguageResponse
    language_raw: str
    source: SourceResponse
    license: LicenseResponse | None = None
    provenance: str
    data_format: str
    size: str
    source_url: str
    tasks: list[TaskResponse] = Field(default_factory=list)
    published_at: datetime | None = None


class DatasetSearchResponse(BaseModel):
    """Réponse de GET /catalog/datasets/search."""

    language_query: str = Field(description="Paramètre de recherche tel que reçu")
    language_code: str = Field(description="Code canonique ISO 639-3 résolu")
    total: int
    datasets: list[DatasetSummaryResponse]


class DatasetDetailResponse(DatasetSummaryResponse):
    """Réponse de GET /catalog/datasets/{dataset_id}."""

    created_at: datetime
    updated_at: datetime
