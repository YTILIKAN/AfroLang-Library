from sqlmodel import Session

from catalog.api_schemas import DatasetSearchResponse
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
