from sqlmodel import Session

from catalog.api_schemas import AppliedFiltersResponse, DatasetFilterResponse, DatasetSearchResponse
from catalog.filter_params import (
    ResolvedFilters,
    normalize_data_format,
    normalize_source_slug,
    resolve_task_filter,
)
from catalog.mappers import dataset_to_summary
from catalog.repository import CatalogRepository
from core.models import Dataset, Language, UNKNOWN


class CatalogService:
    """Logique métier du catalogue — délègue toute persistance au repository."""

    def __init__(self, session: Session) -> None:
        self.repository = CatalogRepository(session)

    def get_dataset(self, dataset_id: int) -> Dataset | None:
        return self.repository.get_dataset_by_id(dataset_id)

    def list_datasets_for_language(self, language_code: str) -> list[Dataset]:
        return self.repository.list_datasets_by_language(language_code)

    def get_language(self, code: str) -> Language | None:
        return self.repository.get_language(code)

    def list_languages(self) -> list[Language]:
        return self.repository.list_languages()

    def search_datasets(self, query: str, *, limit: int = 50) -> list[Dataset]:
        return self.repository.search_datasets(query, limit=limit)

    def search_datasets_by_language(self, language_query: str) -> DatasetSearchResponse:
        """Recherche par langue sur le code canonique ISO 639-3 (FR-11)."""
        language_code = self.repository.resolve_language_code(language_query)
        if language_code is None:
            return DatasetSearchResponse(
                language_query=language_query,
                language_code=UNKNOWN,
                total=0,
                datasets=[],
            )

        datasets = self.repository.list_datasets_by_language(language_code)
        return DatasetSearchResponse(
            language_query=language_query,
            language_code=language_code,
            total=len(datasets),
            datasets=[dataset_to_summary(dataset) for dataset in datasets],
        )

    def filter_datasets(
        self,
        *,
        language: str | None = None,
        source: str | None = None,
        task: str | None = None,
        data_format: str | None = None,
    ) -> DatasetFilterResponse:
        """Filtre combiné sur valeurs normalisées — langue, source, tâche, format (FR-12)."""
        resolved = self._resolve_filters(
            language=language,
            source=source,
            task=task,
            data_format=data_format,
        )

        if resolved.language_query and resolved.language_code is None:
            return DatasetFilterResponse(
                filters=self._applied_filters(resolved),
                total=0,
                datasets=[],
            )

        if resolved.task_query and resolved.task_code is None:
            return DatasetFilterResponse(
                filters=self._applied_filters(resolved),
                total=0,
                datasets=[],
            )

        datasets = self.repository.filter_datasets(
            language_code=resolved.language_code,
            source_slug=resolved.source_slug,
            task_code=resolved.task_code,
            data_format=resolved.data_format,
        )
        return DatasetFilterResponse(
            filters=self._applied_filters(resolved),
            total=len(datasets),
            datasets=[dataset_to_summary(dataset) for dataset in datasets],
        )

    def _resolve_filters(
        self,
        *,
        language: str | None,
        source: str | None,
        task: str | None,
        data_format: str | None,
    ) -> ResolvedFilters:
        language_code = None
        if language:
            language_code = self.repository.resolve_language_code(language)

        task_code = None
        task_query = task.strip() if task else None
        if task_query:
            task_code = resolve_task_filter(task_query)

        source_slug = normalize_source_slug(source) if source else None
        normalized_format = normalize_data_format(data_format) if data_format else None

        return ResolvedFilters(
            language_query=language,
            language_code=language_code,
            source_slug=source_slug,
            task_query=task_query,
            task_code=task_code,
            data_format=normalized_format,
        )

    @staticmethod
    def _applied_filters(resolved: ResolvedFilters) -> AppliedFiltersResponse:
        return AppliedFiltersResponse(
            language=resolved.language_query,
            language_code=resolved.language_code,
            source=resolved.source_slug,
            task=resolved.task_query,
            task_code=resolved.task_code,
            data_format=resolved.data_format,
        )
