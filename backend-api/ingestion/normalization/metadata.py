from core.models import UNKNOWN


def normalize_text(value: str | None) -> str:
    """Remplace toute valeur absente ou vide par « inconnu » (FR-8)."""
    if value is None:
        return UNKNOWN
    stripped = str(value).strip()
    return stripped if stripped else UNKNOWN


def normalize_language_raw(value: str | list[str] | None) -> str:
    if value is None:
        return UNKNOWN
    if isinstance(value, list):
        parts = [part.strip() for part in value if part and part.strip()]
        return ", ".join(parts) if parts else UNKNOWN
    return normalize_text(value)
