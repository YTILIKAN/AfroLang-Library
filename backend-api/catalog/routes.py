from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from catalog import stub as catalog_stub
from catalog.api_schemas import (
    ApiEndpointInfo,
    ApiInfoResponse,
    DatasetDetailResponse,
    DatasetFilterResponse,
    DatasetListResponse,
    DatasetSearchResponse,
    LanguageOverviewResponse,
    SupportedLanguageResponse,
    SupportedLanguagesResponse,
)
from catalog.mappers import dataset_to_detail, dataset_to_summary
from catalog.service import CatalogService
from core.config import Settings, get_settings
from core.database import get_session
from core.language_codes import list_supported_languages

PUBLIC_API_VERSION = "1.0.0"


def get_catalog_service(session: Session = Depends(get_session)) -> CatalogService:
    return CatalogService(session)


def _ensure_at_least_one_filter(
    q: str | None,
    language: str | None,
    source: str | None,
    task: str | None,
    data_format: str | None,
) -> None:
    if not any([q, language, source, task, data_format]):
        raise HTTPException(
            status_code=400,
            detail="Au moins un critère requis : q, language, source, task ou data_format.",
        )


def create_catalog_router(*, tags: list[str], include_root: bool = False) -> APIRouter:
    """Construit un routeur catalog en lecture seule (GET uniquement)."""
    router = APIRouter(tags=tags)

    if include_root:

        @router.get(
            "",
            response_model=ApiInfoResponse,
            summary="Informations sur l'API publique",
            description="Point d'entrée documenté de l'API publique v1 (Story 2.3, FR-15, AD-10).",
        )
        def get_api_info() -> ApiInfoResponse:
            return ApiInfoResponse(
                name="AfroLang-Library Public API",
                version=PUBLIC_API_VERSION,
                read_only=True,
                endpoints=[
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/datasets",
                        description="Liste paginée de l'index complet (lecture seule).",
                    ),
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/datasets/search",
                        description="Recherche de datasets par langue (code ISO 639-3 ou alias).",
                    ),
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/datasets/filter",
                        description=(
                            "Exploration combinée : recherche plein texte (q) et facettes "
                            "langue, source, tâche NLP et format."
                        ),
                    ),
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/datasets/{dataset_id}",
                        description="Fiche dataset avec métadonnées normalisées et lien de redirection.",
                    ),
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/languages",
                        description="Vocabulaire des langues couvertes (code ISO 639-3 et nom).",
                    ),
                    ApiEndpointInfo(
                        method="GET",
                        path="/api/v1/languages/overview",
                        description="Agrégation par langue : datasets et compteurs.",
                    ),
                ],
            )

    @router.get(
        "/datasets",
        response_model=DatasetListResponse,
        summary="Lister l'index des datasets",
        description=(
            "Consultation publique de l'index complet, sans authentification (FR-15). "
            "Pagination optionnelle via limit et offset."
        ),
    )
    def list_datasets(
        limit: int = Query(100, ge=1, le=500, description="Nombre maximum de résultats"),
        offset: int = Query(0, ge=0, description="Décalage pour la pagination"),
        settings: Settings = Depends(get_settings),
        service: CatalogService = Depends(get_catalog_service),
    ) -> DatasetListResponse:
        if settings.catalog_stub:
            total, datasets = catalog_stub.list_datasets(limit=limit, offset=offset)
            return DatasetListResponse(total=total, limit=limit, offset=offset, datasets=datasets)

        total, page = service.list_datasets(limit=limit, offset=offset)
        return DatasetListResponse(
            total=total,
            limit=limit,
            offset=offset,
            datasets=[dataset_to_summary(dataset) for dataset in page],
        )

    @router.get(
        "/datasets/search",
        response_model=DatasetSearchResponse,
        summary="Rechercher des datasets par langue",
        description=(
            "Recherche par code ISO 639-3 ou alias (ex. « yor », « Yoruba », « Yorùbá »). "
            "API publique en lecture seule (FR-15)."
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
        "/languages",
        response_model=SupportedLanguagesResponse,
        summary="Lister les langues couvertes",
        description=(
            "Vocabulaire de langues proposé à la saisie et à la recherche : code canonique "
            "ISO 639-3 et nom d'affichage (FR-11). Un code ISO 639-3 hors de cette liste "
            "reste accepté à la soumission."
        ),
    )
    def list_languages(
        settings: Settings = Depends(get_settings),
        session: Session = Depends(get_session),
    ) -> SupportedLanguagesResponse:
        languages = list_supported_languages(None if settings.catalog_stub else session)
        return SupportedLanguagesResponse(
            total=len(languages),
            languages=[
                SupportedLanguageResponse(code=language.code, name=language.name)
                for language in languages
            ],
        )

    @router.get(
        "/languages/overview",
        response_model=LanguageOverviewResponse,
        summary="Agrégation par langue",
        description="Datasets d'une langue et compteurs basiques (FR-14).",
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
        summary="Explorer les datasets",
        description=(
            "Recherche plein texte sur les métadonnées (q) et filtrage combiné par langue, "
            "source, tâche NLP (vocabulaire contrôlé) et format — valeurs normalisées "
            "(FR-11, FR-12, FR-15). Les critères se cumulent en ET."
        ),
    )
    def filter_datasets(
        q: str | None = Query(None, min_length=1, description="Recherche plein texte (titre, description, langue)"),
        language: str | None = Query(None, min_length=1, description="Code ou nom de langue"),
        source: str | None = Query(None, min_length=1, description="Slug de la source (ex. huggingface)"),
        task: str | None = Query(None, min_length=1, description="Code ou alias de tâche NLP"),
        data_format: str | None = Query(None, min_length=1, description="Format normalisé (ex. text, audio)"),
        settings: Settings = Depends(get_settings),
        service: CatalogService = Depends(get_catalog_service),
    ) -> DatasetFilterResponse:
        _ensure_at_least_one_filter(q, language, source, task, data_format)
        if settings.catalog_stub:
            return catalog_stub.filter_datasets(
                q=q,
                language=language,
                source=source,
                task=task,
                data_format=data_format,
            )
        return service.filter_datasets(
            q=q,
            language=language,
            source=source,
            task=task,
            data_format=data_format,
        )

    @router.get(
        "/datasets/{dataset_id}",
        response_model=DatasetDetailResponse,
        summary="Fiche dataset",
        description="Métadonnées normalisées et lien de redirection `source_url` (FR-13, FR-15).",
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

    return router


catalog_router = create_catalog_router(tags=["catalog"])
public_router = create_catalog_router(tags=["public-api"], include_root=True)
