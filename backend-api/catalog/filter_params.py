from dataclasses import dataclass

from ingestion.normalization.vocabulary import resolve_task_code


@dataclass(frozen=True)
class ResolvedFilters:
    language_query: str | None = None
    language_code: str | None = None
    source_slug: str | None = None
    task_query: str | None = None
    task_code: str | None = None
    data_format: str | None = None


def normalize_source_slug(value: str) -> str:
    return value.strip().lower().replace("_", "-")


def normalize_data_format(value: str) -> str:
    return value.strip().lower()


def resolve_task_filter(value: str) -> str | None:
    """Résout un filtre tâche vers le code du vocabulaire contrôlé (FR-12)."""
    return resolve_task_code(value)
