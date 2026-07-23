import httpx

from core.config import Settings, get_settings
from ingestion.connectors.base import SourceConnector
from ingestion.connectors.schemas import RawDatasetMetadata

KAGGLE_DATASETS_ENDPOINT = "https://www.kaggle.com/api/v1/datasets/list"

# Kaggle n'a pas de champ de langue structuré : on interroge par mot-clé et on trace
# le terme de recherche utilisé comme language_raw (limitation documentée, même
# heuristique MVP que le connecteur Hugging Face — cf. AFRICAN_LANGUAGE_ISO639_1).
AFRICAN_LANGUAGE_SEARCH_TERMS: list[str] = [
    "yoruba", "swahili", "hausa", "igbo", "zulu", "wolof", "amharic", "somali",
]


class KaggleConnector(SourceConnector):
    """Connecteur de source Kaggle (AD-6, FR-1)."""

    @property
    def source_slug(self) -> str:
        return "kaggle"

    def _search_datasets(self, term: str, settings: Settings) -> list[dict]:
        response = httpx.get(
            KAGGLE_DATASETS_ENDPOINT,
            params={"search": term},
            auth=(settings.kaggle_username, settings.kaggle_key),
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        settings = get_settings()
        if not settings.kaggle_username or not settings.kaggle_key:
            raise RuntimeError("Identifiants Kaggle absents (KAGGLE_USERNAME/KAGGLE_KEY)")

        seen_refs: set[str] = set()
        datasets: list[RawDatasetMetadata] = []

        for term in AFRICAN_LANGUAGE_SEARCH_TERMS:
            for entry in self._search_datasets(term, settings):
                ref = entry.get("ref")
                if not ref or ref in seen_refs:
                    continue
                seen_refs.add(ref)
                datasets.append(self._to_raw_metadata(entry, term))

        return datasets

    def _to_raw_metadata(self, entry: dict, search_term: str) -> RawDatasetMetadata:
        ref = entry["ref"]
        dataset_size = entry.get("datasetSize")
        task_tags = [name for name in (_tag_name(tag) for tag in entry.get("tags") or []) if name]

        return RawDatasetMetadata(
            external_id=ref,
            title=entry.get("title") or ref,
            source_slug=self.source_slug,
            source_url=entry.get("url") or f"https://www.kaggle.com/datasets/{ref}",
            language_raw=search_term,
            task_tags_raw=task_tags,
            description_raw=None,
            license_raw=entry.get("licenseName"),
            data_format_raw=None,
            size_raw=str(dataset_size) if dataset_size is not None else None,
            published_at_raw=None,
        )


def _tag_name(tag: str | dict) -> str | None:
    """L'API Kaggle renvoie les tags comme des objets (ex. {"nameNullable": "nlp", ...}), pas des chaînes."""
    if isinstance(tag, str):
        return tag or None
    if isinstance(tag, dict):
        return tag.get("nameNullable") or tag.get("name")
    return None
