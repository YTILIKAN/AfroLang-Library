import unicodedata

from sqlmodel import Session, select

from core.models import Language

# Alias statiques courants (complétés par la table `language` en base).
STATIC_LANGUAGE_ALIASES: dict[str, str] = {
    "yor": "yor",
    "yoruba": "yor",
    "yorùbá": "yor",
    "wol": "wol",
    "wolof": "wol",
    "swh": "swh",
    "swahili": "swh",
    "swa": "swh",
}


def fold_text(value: str) -> str:
    """Normalise casse et accents pour la résolution de langue."""
    decomposed = unicodedata.normalize("NFD", value.strip().casefold())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def resolve_language_code(query: str, session: Session | None = None) -> str | None:
    """
    Résout une requête langue vers un code canonique ISO 639-3 (FR-11).

    Ordre : alias statiques → code en base → nom en base.
    """
    folded = fold_text(query)
    if not folded:
        return None

    if folded in STATIC_LANGUAGE_ALIASES:
        return STATIC_LANGUAGE_ALIASES[folded]

    if session is None:
        return None

    if len(folded) == 3:
        by_code = session.get(Language, folded)
        if by_code is not None:
            return by_code.code

    for candidate in session.exec(select(Language)).all():
        if fold_text(candidate.name) == folded:
            return candidate.code

    return None
