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


class DatasetListResponse(BaseModel):
    """Réponse de GET /api/v1/datasets — index complet en lecture seule."""

    total: int
    limit: int
    offset: int
    datasets: list[DatasetSummaryResponse]


class DatasetDetailResponse(DatasetSummaryResponse):
    """Réponse de GET /catalog/datasets/{dataset_id}."""

    created_at: datetime
    updated_at: datetime


class AppliedFiltersResponse(BaseModel):
    """Filtres appliqués après normalisation (Story 2.1)."""

    language: str | None = Field(default=None, description="Paramètre langue tel que reçu")
    language_code: str | None = Field(default=None, description="Code ISO 639-3 résolu")
    source: str | None = Field(default=None, description="Slug source normalisé")
    task: str | None = Field(default=None, description="Paramètre tâche tel que reçu")
    task_code: str | None = Field(default=None, description="Code tâche du vocabulaire contrôlé")
    data_format: str | None = Field(default=None, description="Format de données normalisé")


class DatasetFilterResponse(BaseModel):
    """Réponse de GET /catalog/datasets/filter (Story 2.1)."""

    filters: AppliedFiltersResponse
    total: int
    datasets: list[DatasetSummaryResponse]


class LanguageAggregationStats(BaseModel):
    """Compteurs basiques pour une langue (FR-14)."""

    dataset_count: int = Field(description="Nombre de datasets référencés pour la langue")
    task_count: int = Field(description="Nombre de tâches NLP distinctes couvertes")
    tasks_covered: list[TaskResponse] = Field(default_factory=list, description="Tâches NLP disponibles")


class LanguageOverviewResponse(BaseModel):
    """Réponse de GET /catalog/languages/overview (Story 2.2)."""

    language_query: str = Field(description="Paramètre langue tel que reçu")
    language_code: str = Field(description="Code canonique ISO 639-3 résolu")
    language: LanguageResponse | None = Field(default=None, description="Métadonnées de la langue")
    stats: LanguageAggregationStats
    datasets: list[DatasetSummaryResponse]


class ApiEndpointInfo(BaseModel):
    method: str
    path: str
    description: str


class ApiInfoResponse(BaseModel):
    """Manifeste de l'API publique v1 (Story 2.3)."""

    name: str
    version: str
    read_only: bool = True
    endpoints: list[ApiEndpointInfo]
