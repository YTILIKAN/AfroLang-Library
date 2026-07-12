from abc import ABC, abstractmethod

from ingestion.connectors.schemas import ConnectorFetchResult, RawDatasetMetadata


class SourceConnector(ABC):
    """Contrat commun que tout connecteur de source doit respecter (AD-6, FR-1)."""

    @property
    @abstractmethod
    def source_slug(self) -> str:
        """Identifiant stable de la source (ex. huggingface, kaggle)."""

    @abstractmethod
    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        """
        Récupère les métadonnées brutes depuis la source externe.

        Ne doit jamais lever d'exception non gérée : les erreurs sont remontées
        via ConnectorFetchResult.errors par l'orchestrateur d'ingestion.
        """

    def run(self) -> ConnectorFetchResult:
        """Point d'entrée standardisé avec traçabilité."""
        from core.models import utc_now

        try:
            datasets = self.fetch_raw_datasets()
            return ConnectorFetchResult(
                source_slug=self.source_slug,
                fetched_at=utc_now(),
                datasets=datasets,
            )
        except Exception as exc:  # noqa: BLE001 — encapsulation volontaire AD-13
            return ConnectorFetchResult(
                source_slug=self.source_slug,
                fetched_at=utc_now(),
                errors=[str(exc)],
            )
