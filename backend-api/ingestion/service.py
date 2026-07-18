from dataclasses import dataclass, field

from sqlmodel import Session

from core.models import Dataset, Provenance, utc_now
from core.schemas import DatasetInput
from ingestion.connectors.base import SourceConnector
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.models import SyncLog
from ingestion.normalization import (
    NormalizationResult,
    normalize_dataset_metadata,
    resolve_language_for_ingestion,
)
from ingestion.repository import IngestionRepository


@dataclass
class IngestionOutcome:
    """Résultat d'une écriture atomique de batch pour une source (AD-11, Story 1.8/1.9)."""

    added: list[Dataset]
    removed: list[int] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class IngestionService:
    """Orchestration de l'ingestion — délègue toute persistance au repository."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = IngestionRepository(session)

    def normalize_raw_dataset(
        self,
        raw: RawDatasetMetadata,
        *,
        language_code: str | None = None,
        language_name: str | None = None,
    ) -> NormalizationResult:
        return normalize_dataset_metadata(
            raw,
            language_code=language_code,
            language_name=language_name,
        )

    def normalize_and_prepare(
        self,
        raw: RawDatasetMetadata,
        *,
        provenance: Provenance = Provenance.SYNCHRONISE,
    ) -> NormalizationResult:
        """Résout la langue canonique (Story 1.6) puis normalise tâches/métadonnées (Story 1.7)."""
        resolution = resolve_language_for_ingestion(raw.language_raw, self.session)
        result = normalize_dataset_metadata(raw, language_code=resolution.code, provenance=provenance)
        if not resolution.matched:
            result.warnings.append(f"Langue non mappable : {raw.language_raw!r} — à revoir")
        return result

    def persist_dataset(self, payload: DatasetInput) -> Dataset:
        return self.repository.save_dataset(payload)

    def ingest_source(self, source_slug: str, raw_datasets: list[RawDatasetMetadata]) -> IngestionOutcome:
        """
        Normalise, écrit le batch et retire les datasets `synchronisé` disparus pour
        cette source — le tout en une seule transaction (AD-11, AD-15, Story 1.8/1.9).
        """
        payloads: list[DatasetInput] = []
        warnings: list[str] = []

        for raw in raw_datasets:
            result = self.normalize_and_prepare(raw)
            payloads.append(result.dataset)
            warnings.extend(result.warnings)

        fetched_external_ids = {raw.external_id for raw in raw_datasets}
        existing_synced = self.repository.list_synced_datasets(source_slug)
        stale_dataset_ids = [
            dataset_id
            for external_id, dataset_id in existing_synced.items()
            if external_id not in fetched_external_ids
        ]

        saved = self.repository.write_batch(payloads, remove_dataset_ids=stale_dataset_ids)
        return IngestionOutcome(added=saved, removed=stale_dataset_ids, warnings=warnings)

    def run_for_connector(self, connector: SourceConnector) -> SyncLog:
        """
        Exécute un connecteur et journalise le résultat (AD-13, Story 1.10) : un échec du
        connecteur est enregistré comme tel, sans jamais toucher aux données existantes.
        """
        started_at = utc_now()
        result = connector.run()

        if not result.success:
            entry = SyncLog(
                source_slug=connector.source_slug,
                started_at=started_at,
                finished_at=utc_now(),
                added_count=0,
                removed_count=0,
                errors="; ".join(result.errors),
                success=False,
            )
            return self.repository.record_sync_log(entry)

        outcome = self.ingest_source(connector.source_slug, result.datasets)
        entry = SyncLog(
            source_slug=connector.source_slug,
            started_at=started_at,
            finished_at=utc_now(),
            added_count=len(outcome.added),
            removed_count=len(outcome.removed),
            errors="; ".join(outcome.warnings),
            success=True,
        )
        return self.repository.record_sync_log(entry)

    def run_all(self, connectors: list[SourceConnector]) -> list[SyncLog]:
        """
        Exécute une ingestion à la demande pour tous les connecteurs (FR-2, AD-5) : l'échec
        inattendu d'un connecteur n'empêche jamais les autres de s'exécuter (AD-13).
        """
        logs: list[SyncLog] = []
        for connector in connectors:
            try:
                logs.append(self.run_for_connector(connector))
            except Exception as exc:  # noqa: BLE001 — ceinture-et-bretelles au-delà de connector.run()
                logs.append(
                    self.repository.record_sync_log(
                        SyncLog(
                            source_slug=connector.source_slug,
                            started_at=utc_now(),
                            finished_at=utc_now(),
                            added_count=0,
                            removed_count=0,
                            errors=str(exc),
                            success=False,
                        )
                    )
                )
        return logs
