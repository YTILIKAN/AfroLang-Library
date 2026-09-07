import unicodedata
from typing import NamedTuple

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



class SupportedLanguage(NamedTuple):
    """Une langue couverte par l'index, telle que proposée dans les formulaires."""

    code: str
    name: str


# Nom d'affichage de chaque code canonique couvert par l'index. Source de vérité unique
# du sélecteur de langue (formulaires de contribution et d'administration) et du message
# d'erreur 422 : toute langue ajoutée ici devient proposée partout (FR-11).
SUPPORTED_LANGUAGE_NAMES: dict[str, str] = {
    "amh": "Amharique",
    "nya": "Chichewa",
    "hau": "Haoussa",
    "ibo": "Igbo",
    "kin": "Kinyarwanda",
    "lin": "Lingala",
    "lug": "Luganda",
    "mlg": "Malgache",
    "orm": "Oromo",
    "sna": "Shona",
    "som": "Somali",
    "sot": "Sotho du Sud",
    "swh": "Swahili",
    "tir": "Tigrigna",
    "tso": "Tsonga",
    "tsn": "Tswana",
    "wol": "Wolof",
    "xho": "Xhosa",
    "yor": "Yoruba",
    "zul": "Zoulou",
}


def list_supported_languages(session: Session | None = None) -> list[SupportedLanguage]:
    """
    Langues proposées à la saisie, triées par nom (FR-11).

    Le registre statique fournit les noms d'affichage ; la table `language` ajoute les
    codes déjà présents dans l'index mais pas encore nommés ici, pour que la couverture
    réelle reste visible sans redéploiement.
    """
    names = dict(SUPPORTED_LANGUAGE_NAMES)
    if session is not None:
        for candidate in session.exec(select(Language)).all():
            names.setdefault(candidate.code, candidate.name)
    return sorted(
        (SupportedLanguage(code=code, name=name) for code, name in names.items()),
        key=lambda language: fold_text(language.name),
    )


def unknown_language_detail(query: str, session: Session | None = None) -> str:
    """
    Message du 422 « langue non reconnue » : dit ce qui est attendu, pas seulement ce qui
    a échoué. Un code hors index reste accepté s'il respecte la norme ISO 639-3, d'où le
    rappel explicite du format (« fra » pour le français) avant la liste des langues.
    """
    listing = ", ".join(
        f"{language.name} ({language.code})" for language in list_supported_languages(session)
    )
    return (
        f"Langue « {query.strip()} » non reconnue. "
        "Attendu : un code ISO 639-3 de 3 lettres (ex. « fra » pour le français, "
        "« eng » pour l'anglais) ou le nom d'une langue couverte par l'index. "
        f"Langues couvertes : {listing}."
    )

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
