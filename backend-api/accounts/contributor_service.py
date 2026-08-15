from fastapi import HTTPException, status
from sqlmodel import Session

from accounts.admin_repository import AdminDatasetRepository
from accounts.admin_service import AdminDatasetService
from accounts.api_schemas import (
    AdminDatasetCreateRequest,
    AdminDatasetUpdateRequest,
    SubmitDatasetRequest,
    UpdateDatasetRequest,
)
from accounts.contributor_repository import ContributorDatasetRepository
from catalog.api_schemas import DatasetDetailResponse, DatasetSummaryResponse
from catalog.mappers import dataset_to_detail, dataset_to_summary
from core.models import Account, Dataset, Provenance


class ContributorDatasetService:
    """Soumission et gestion des contributions chercheur (FR-17, FR-18, Stories 3.2–3.3)."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.admin = AdminDatasetService(session)
        self.repository = ContributorDatasetRepository(session)
        self.admin_repository = AdminDatasetRepository(session)

    def submit(self, account: Account, payload: SubmitDatasetRequest) -> DatasetDetailResponse:
        # Une source sans API publique est référencée par le même mécanisme, mais son
        # origine reste `manuel` (FR-5) ; dans les deux cas la provenance est le compte
        # contributeur, et l'ingestion automatique ne retire jamais ces entrées (AD-15).
        manual = payload.manual_source
        admin_payload = AdminDatasetCreateRequest(
            title=payload.title,
            source_url=payload.source_url,
            language=payload.language,
            task=payload.task,
            description=payload.description,
            license_name=payload.license_name,
            data_format=payload.data_format,
            size=payload.size,
            provenance=Provenance.MANUEL if manual else Provenance.CONTRIBUE,
            source_slug="manual" if manual else "contribution",
            contributor_account_id=account.id,
        )
        return self.admin.create_dataset(admin_payload)

    def list_mine(self, account: Account) -> tuple[int, list[DatasetSummaryResponse]]:
        datasets = self.repository.list_by_contributor(account.id)
        summaries = [dataset_to_summary(dataset) for dataset in datasets]
        return len(summaries), summaries

    def update_mine(
        self,
        account: Account,
        dataset_id: int,
        payload: UpdateDatasetRequest,
    ) -> DatasetDetailResponse:
        if self.repository.get_owned_dataset(dataset_id, account.id) is None:
            self._raise_forbidden_or_missing(dataset_id, account.id)

        if payload.title is None:
            return self.admin.get_dataset(dataset_id)

        existing = self.admin.catalog.get_dataset(dataset_id)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")

        merged = self.admin._merge_update(  # noqa: SLF001
            existing,
            AdminDatasetUpdateRequest(title=payload.title),
        )
        saved = self.admin.ingestion.persist_dataset(merged)
        self.admin_repository.set_contributor(saved.id, account.id)
        reloaded = self.admin_repository.load_dataset(saved.id)
        return dataset_to_detail(reloaded)  # type: ignore[arg-type]

    def delete_mine(self, account: Account, dataset_id: int) -> None:
        if self.repository.get_owned_dataset(dataset_id, account.id) is None:
            self._raise_forbidden_or_missing(dataset_id, account.id)
        if not self.admin_repository.delete_dataset(dataset_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")

    def _raise_forbidden_or_missing(self, dataset_id: int, account_id: int) -> None:
        dataset = self.session.get(Dataset, dataset_id)
        if dataset is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")
        if dataset.contributor_account_id != account_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à ce dataset")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")
