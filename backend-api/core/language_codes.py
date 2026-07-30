import unicodedata

from sqlmodel import Session, select

from core.models import Language

# Alias statiques courants (complétés par la table `language` en base).
# Inclut les noms/variantes courants ainsi que les codes ISO 639-1 des langues
# africaines couvertes par les connecteurs d'ingestion (Story 1.4, 1.6), mappés
# vers leur code canonique ISO 639-3.
STATIC_LANGUAGE_ALIASES: dict[str, str] = {
    "yor": "yor",
    "yoruba": "yor",
    "yorùbá": "yor",
    "yo": "yor",
    "wol": "wol",
    "wolof": "wol",
    "wo": "wol",
    "swh": "swh",
    "swahili": "swh",
    "swa": "swh",
    "sw": "swh",
    "hau": "hau",
    "hausa": "hau",
    "ha": "hau",
    "ibo": "ibo",
    "igbo": "ibo",
    "ig": "ibo",
    "zul": "zul",
    "zulu": "zul",
    "zu": "zul",
    "xho": "xho",
    "xhosa": "xho",
    "xh": "xho",
    "amh": "amh",
    "amharic": "amh",
    "am": "amh",
    "som": "som",
    "somali": "som",
    "so": "som",
    "kin": "kin",
    "kinyarwanda": "kin",
    "rw": "kin",
    "sna": "sna",
    "shona": "sna",
    "sn": "sna",
    "mlg": "mlg",
    "malagasy": "mlg",
    "mg": "mlg",
    "lin": "lin",
    "lingala": "lin",
    "ln": "lin",
    "lug": "lug",
    "ganda": "lug",
    "luganda": "lug",
    "lg": "lug",
    "nya": "nya",
    "chichewa": "nya",
    "nyanja": "nya",
    "ny": "nya",
    "sot": "sot",
    "sotho": "sot",
    "st": "sot",
    "tsn": "tsn",
    "tswana": "tsn",
    "tn": "tsn",
    "tso": "tso",
    "tsonga": "tso",
    "ts": "tso",
    "orm": "orm",
    "oromo": "orm",
    "om": "orm",
    "tir": "tir",
    "tigrinya": "tir",
    "ti": "tir",
}


def fold_text(value: str) -> str:
    """Normalise casse et accents pour la résolution de langue."""
    decomposed = unicodedata.normalize("NFD", value.strip().casefold())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def resolve_language_code(query: str, session: Session | None = None) -> str | None:
    """
    Résout une requête langue vers un code canonique ISO 639-3 (FR-11, FR-6).

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
