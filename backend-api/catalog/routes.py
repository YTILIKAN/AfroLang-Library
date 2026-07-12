from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from catalog import stub as catalog_stub
from catalog.api_schemas import DatasetDetailResponse, DatasetSearchResponse
from catalog.mappers import dataset_to_detail, dataset_to_summary
from catalog.service import CatalogService
from catalog.stub import resolve_language_code
from core.config import Settings, get_settings
from core.database import get_session
from core.models import UNKNOWN

router = APIRouter(prefix="/catalog", tags=["catalog"])


def get_catalog_service(session: Session = Depends(get_session)) -> CatalogService:
    return CatalogService(session)


@router.get(
    "/datasets/search",
    response_model=DatasetSearchResponse,
    summary="Rechercher des datasets par langue",
    description=(
        "Recherche par code ISO 639-3 ou alias (ex. « yor », « Yoruba », « Yorùbá »). "
        "Contrat figé en Story 1.3 — bouchon actif tant que `CATALOG_STUB=true`."
    ),
)
def search_datasets_by_language(
    language: str = Query(..., min_length=1, description="Code ou nom de langue"),
    settings: Settings = Depends(get_settings),
    service: CatalogService = Depends(get_catalog_service),
) -> DatasetSearchResponse:
    if settings.catalog_stub:
        return catalog_stub.search_by_language(language)

    language_code = resolve_language_code(language) or language.strip().lower()
    datasets = service.list_datasets_for_language(language_code)
    return DatasetSearchResponse(
        language_query=language,
        language_code=language_code if datasets else UNKNOWN,
        total=len(datasets),
        datasets=[dataset_to_summary(dataset) for dataset in datasets],
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
