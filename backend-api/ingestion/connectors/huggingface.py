import httpx

from ingestion.connectors.base import SourceConnector
from ingestion.connectors.schemas import RawDatasetMetadata

HF_DATASETS_ENDPOINT = "https://huggingface.co/api/datasets"

# Liste curée, non-exhaustive, de codes ISO 639-1 de langues africaines (Story 1.4).
# Heuristique MVP pour la question ouverte « détection langue africaine » — étendre
# cette liste ne touche que ce fichier (AD-6), aucune classification automatique.
AFRICAN_LANGUAGE_ISO639_1: list[str] = [
    "sw", "yo", "ha", "ig", "zu", "xh", "am", "so",
    "rw", "sn", "mg", "wo", "ln", "lg", "ny", "st",
    "tn", "ts", "om", "ti",
]


class HuggingFaceConnector(SourceConnector):
    """Connecteur de source Hugging Face Hub (AD-6, FR-1)."""

    @property
    def source_slug(self) -> str:
        return "huggingface"

    def _search_datasets(self, language_tag: str) -> list[dict]:
        response = httpx.get(
            HF_DATASETS_ENDPOINT,
            params={"filter": f"language:{language_tag}", "full": "true", "limit": 100},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        seen_ids: set[str] = set()
        datasets: list[RawDatasetMetadata] = []

        for language_tag in AFRICAN_LANGUAGE_ISO639_1:
            for entry in self._search_datasets(language_tag):
                dataset_id = entry.get("id")
                if not dataset_id or dataset_id in seen_ids:
                    continue
                seen_ids.add(dataset_id)
                datasets.append(self._to_raw_metadata(entry))

        return datasets

    def _to_raw_metadata(self, entry: dict) -> RawDatasetMetadata:
        dataset_id = entry["id"]
        card_data = entry.get("cardData") or {}
        tags: list[str] = entry.get("tags") or []

        task_tags = [tag.removeprefix("task_categories:") for tag in tags if tag.startswith("task_categories:")]
        size_tags = [tag.removeprefix("size_categories:") for tag in tags if tag.startswith("size_categories:")]
        license_tags = [tag.removeprefix("license:") for tag in tags if tag.startswith("license:")]

        license_raw = _as_single_string(card_data.get("license")) or (license_tags[0] if license_tags else None)

        return RawDatasetMetadata(
            external_id=dataset_id,
            title=card_data.get("pretty_name") or dataset_id,
            source_slug=self.source_slug,
            source_url=f"https://huggingface.co/datasets/{dataset_id}",
            language_raw=card_data.get("language"),
            task_tags_raw=task_tags,
            description_raw=entry.get("description"),
            license_raw=license_raw,
            data_format_raw=None,
            size_raw=size_tags[0] if size_tags else None,
            published_at_raw=None,
        )


def _as_single_string(value: str | list[str] | None) -> str | None:
    """cardData renvoie parfois plusieurs valeurs (ex. license: [cc-by-sa-3.0, gfdl]) : les joindre."""
    if value is None:
        return None
    if isinstance(value, list):
        parts = [str(item).strip() for item in value if item and str(item).strip()]
        return ", ".join(parts) if parts else None
    return str(value)
