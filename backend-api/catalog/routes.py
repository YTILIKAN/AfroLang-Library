from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from catalog import stub as catalog_stub
from catalog.api_schemas import (
    DatasetDetailResponse,
    DatasetFilterResponse,
    DatasetSearchResponse,
    LanguageOverviewResponse,
)
from catalog.mappers import dataset_to_detail
from catalog.service import CatalogService
from core.config import Settings, get_settings
from core.database import get_session

router = APIRouter(prefix="/catalog", tags=["catalog"])


def get_catalog_service(session: Session = Depends(get_session)) -> CatalogService:
    return CatalogService(session)


def _ensure_at_least_one_filter(
    language: str | None,
    source: str | None,
    task: str | None,
    data_format: str | None,
) -> None:
    if not any([language, source, task, data_format]):
        raise HTTPException(
            status_code=400,
            detail="Au moins un filtre requis : language, source, task ou data_format.",
        )


@router.get(
    "/datasets/search",
    response_model=DatasetSearchResponse,
    summary="Rechercher des datasets par langue",
    description=(
        "Recherche par code ISO 639-3 ou alias (ex. « yor », « Yoruba », « Yorùbá »). "
        "Implémentation réelle (Story 1.11) ; bouchon disponible via `CATALOG_STUB=true`."
    ),
)
def search_datasets_by_language(
    language: str = Query(..., min_length=1, description="Code ou nom de langue"),
    settings: Settings = Depends(get_settings),
    service: CatalogService = Depends(get_catalog_service),
) -> DatasetSearchResponse:
    if settings.catalog_stub:
        return catalog_stub.search_by_language(language)
    return service.search_datasets_by_language(language)


@router.get(
    "/languages/overview",
    response_model=LanguageOverviewResponse,
    summary="Agrégation par langue",
    description=(
        "Retourne les datasets d'une langue et des compteurs basiques "
        "(nombre de datasets, tâches NLP couvertes). Story 2.2 — FR-14."
    ),
)
def get_language_overview(
    language: str = Query(..., min_length=1, description="Code ou nom de langue"),
    settings: Settings = Depends(get_settings),
    service: CatalogService = Depends(get_catalog_service),
) -> LanguageOverviewResponse:
    if settings.catalog_stub:
        return catalog_stub.get_language_overview(language)
    return service.get_language_overview(language)


@router.get(
    "/datasets/filter",
    response_model=DatasetFilterResponse,
    summary="Filtrer les datasets",
    description=(
        "Filtre combiné par langue (code ISO 639-3), source, tâche NLP (vocabulaire contrôlé) "
        "et format de données. Story 2.1 — opère sur les valeurs normalisées (FR-12)."
    ),
)
def filter_datasets(
    language: str | None = Query(None, min_length=1, description="Code ou nom de langue"),
    source: str | None = Query(None, min_length=1, description="Slug de la source (ex. huggingface)"),
    task: str | None = Query(None, min_length=1, description="Code ou alias de tâche NLP"),
    data_format: str | None = Query(None, min_length=1, description="Format normalisé (ex. text, audio)"),
    settings: Settings = Depends(get_settings),
    service: CatalogService = Depends(get_catalog_service),
) -> DatasetFilterResponse:
    _ensure_at_least_one_filter(language, source, task, data_format)
    if settings.catalog_stub:
        return catalog_stub.filter_datasets(
            language=language,
            source=source,
            task=task,
            data_format=data_format,
        )
    return service.filter_datasets(
        language=language,
        source=source,
        task=task,
        data_format=data_format,
    )


@router.get(
    "/datasets/{dataset_id}",
    response_model=DatasetDetailResponse,
    summary="Fiche dataset",
    description="Retourne les métadonnées normalisées d'un dataset et son lien de redirection.",
)
def get_dataset(
    dataset_id: int,
    settings: Settings = Depends(get_settings),
    service: CatalogService = Depends(get_catalog_service),
) -> DatasetDetailResponse:
    if settings.catalog_stub:
        dataset = catalog_stub.get_dataset_detail(dataset_id)
        if dataset is None:
            raise HTTPException(status_code=404, detail="Dataset introuvable")
        return dataset

    dataset = service.get_dataset(dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset introuvable")
    return dataset_to_detail(dataset)
