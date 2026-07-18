import re
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlmodel import Session

from accounts.admin_repository import AdminDatasetRepository
from accounts.api_schemas import AdminDatasetCreateRequest, AdminDatasetUpdateRequest
from catalog.api_schemas import DatasetDetailResponse, DatasetSummaryResponse
from catalog.filter_params import normalize_data_format, normalize_source_slug, resolve_task_filter
from catalog.language_resolver import resolve_language_code
from catalog.mappers import dataset_to_detail, dataset_to_summary
from catalog.service import CatalogService
from core.models import Language, Provenance, UNKNOWN
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
from ingestion.service import IngestionService


def _slugify(value: str) -> str:
    folded = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return folded.strip("-") or "dataset"


class AdminDatasetService:
    """CRUD global sur l'index — réservé au rôle Admin (FR-19, AD-14)."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.catalog = CatalogService(session)
        self.ingestion = IngestionService(session)
        self.repository = AdminDatasetRepository(session)

    def list_datasets(self) -> tuple[int, list[DatasetSummaryResponse]]:
        datasets = self.catalog.list_all_datasets()
        summaries = [dataset_to_summary(dataset) for dataset in datasets]
        return len(summaries), summaries

    def get_dataset(self, dataset_id: int) -> DatasetDetailResponse:
        dataset = self.catalog.get_dataset(dataset_id)
        if dataset is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")
        return dataset_to_detail(dataset)

    def create_dataset(self, payload: AdminDatasetCreateRequest) -> DatasetDetailResponse:
        dataset_input = self._build_dataset_input(payload)
        saved = self.ingestion.persist_dataset(dataset_input)
        if payload.contributor_account_id is not None:
            self.repository.set_contributor(saved.id, payload.contributor_account_id)
            saved = self.repository.load_dataset(saved.id)
        return dataset_to_detail(saved)  # type: ignore[arg-type]

    def update_dataset(self, dataset_id: int, payload: AdminDatasetUpdateRequest) -> DatasetDetailResponse:
        existing = self.catalog.get_dataset(dataset_id)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")

        merged = self._merge_update(existing, payload)
        saved = self.ingestion.persist_dataset(merged)
        if payload.contributor_account_id is not None:
            self.repository.set_contributor(saved.id, payload.contributor_account_id)
            saved = self.repository.load_dataset(saved.id)
        return dataset_to_detail(saved)  # type: ignore[arg-type]

    def delete_dataset(self, dataset_id: int) -> None:
        if not self.repository.delete_dataset(dataset_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")

    def _merge_update(self, existing, payload: AdminDatasetUpdateRequest) -> DatasetInput:
        language_query = payload.language or existing.language_code
        language_code = self._resolve_language_code(language_query)
        task_query = payload.task or (existing.tasks[0].code if existing.tasks else "inconnu")
        task_code = self._resolve_task_code(task_query)

        provenance = payload.provenance or existing.provenance
        source_slug = normalize_source_slug(payload.source_slug) if payload.source_slug else existing.source.slug

        return DatasetInput(
            external_id=existing.external_id,
            title=payload.title or existing.title,
            description=payload.description if payload.description is not None else existing.description,
            source=SourceInput(
                slug=source_slug,
                name=payload.source_name or existing.source.name,
                base_url=existing.source.base_url,
            ),
            language=self._language_input(language_code, payload.language_raw or existing.language_raw),
            language_raw=payload.language_raw or existing.language_raw,
            provenance=provenance,
            source_url=payload.source_url or existing.source_url,
            license=self._license_input(payload, existing),
            data_format=payload.data_format if payload.data_format is not None else existing.data_format,
            size=payload.size if payload.size is not None else existing.size,
            task_codes=[task_code],
            task_tags_raw=payload.task or existing.task_tags_raw,
            published_at=existing.published_at,
        )

    def _build_dataset_input(self, payload: AdminDatasetCreateRequest) -> DatasetInput:
        language_code = self._resolve_language_code(payload.language)
        task_code = self._resolve_task_code(payload.task)
        source_slug = normalize_source_slug(payload.source_slug)
        external_id = payload.external_id or self._default_external_id(payload.source_url, payload.title)

        return DatasetInput(
            external_id=external_id,
            title=payload.title,
            description=payload.description or UNKNOWN,
            source=SourceInput(
                slug=source_slug,
                name=payload.source_name or source_slug.replace("-", " ").title(),
                base_url=payload.source_base_url or UNKNOWN,
            ),
            language=self._language_input(language_code, payload.language_raw or payload.language),
            language_raw=payload.language_raw or payload.language,
            provenance=payload.provenance,
            source_url=payload.source_url,
            license=LicenseInput(
                name=payload.license_name or UNKNOWN,
                spdx_id=payload.license_spdx_id,
                url=payload.license_url or UNKNOWN,
            ),
            data_format=normalize_data_format(payload.data_format) if payload.data_format else UNKNOWN,
            size=payload.size or UNKNOWN,
            task_codes=[task_code],
            task_tags_raw=payload.task,
            published_at=payload.published_at,
        )

    def _resolve_language_code(self, query: str) -> str:
        language_code = resolve_language_code(query, self.session)
        if language_code is not None:
            return language_code
        folded = query.strip().lower()
        if len(folded) == 3:
            return folded
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Langue non reconnue",
        )

    @staticmethod
    def _resolve_task_code(query: str) -> str:
        task_code = resolve_task_filter(query)
        if task_code is not None:
            return task_code
        folded = query.strip().lower()
        if folded:
            return folded
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tâche NLP non reconnue",
        )

    def _language_input(self, language_code: str, language_raw: str) -> LanguageInput:
        language = self.session.get(Language, language_code)
        if language is not None:
            return LanguageInput(
                code=language.code,
                name=language.name,
                family=language.family,
                region=language.region,
            )
        return LanguageInput(code=language_code, name=language_raw, family=UNKNOWN, region=UNKNOWN)

    @staticmethod
    def _license_input(payload: AdminDatasetUpdateRequest, existing) -> LicenseInput | None:
        if existing.license is None and payload.license_name is None:
            return LicenseInput()
        return LicenseInput(
            name=payload.license_name or (existing.license.name if existing.license else UNKNOWN),
            spdx_id=payload.license_spdx_id or (existing.license.spdx_id if existing.license else None),
            url=payload.license_url or (existing.license.url if existing.license else UNKNOWN),
        )

    @staticmethod
    def _default_external_id(source_url: str, title: str) -> str:
        path = urlparse(source_url).path.strip("/")
        if path:
            return path.split("/")[-1]
        return f"manual/{_slugify(title)}"
