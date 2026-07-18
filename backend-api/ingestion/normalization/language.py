from dataclasses import dataclass

from sqlmodel import Session

from core.language_codes import resolve_language_code

UNRESOLVED_LANGUAGE_CODE = "und"


@dataclass
class LanguageResolution:
    """Résultat de la résolution de langue à l'ingestion (FR-6)."""

    code: str
    matched: bool


def resolve_language_for_ingestion(raw: str | list[str] | None, session: Session) -> LanguageResolution:
    """
    Résout la valeur brute de langue d'un connecteur vers un code canonique ISO 639-3.

    Essaie chaque candidat (une source peut renvoyer plusieurs valeurs, ex. HF) via la
    table d'alias + la table `Language` en base ; le premier match gagne. Aucune
    résolution possible -> code « und » (indéterminé), matched=False, pour que la
    valeur soit signalée pour revue plutôt que perdue silencieusement (FR-6).
    """
    if raw is None:
        candidates: list[str] = []
    elif isinstance(raw, list):
        candidates = [candidate for candidate in raw if candidate and candidate.strip()]
    else:
        candidates = [raw] if raw.strip() else []

    for candidate in candidates:
        code = resolve_language_code(candidate, session)
        if code is not None:
            return LanguageResolution(code=code, matched=True)

    return LanguageResolution(code=UNRESOLVED_LANGUAGE_CODE, matched=False)
