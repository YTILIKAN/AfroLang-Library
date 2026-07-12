from dataclasses import dataclass

UNKNOWN_TASK_CODE = "inconnu"


def _normalize_alias(value: str) -> str:
    return value.strip().lower().replace("_", "-")


@dataclass(frozen=True)
class TaskDefinition:
    code: str
    label: str
    aliases: frozenset[str]


TASK_VOCABULARY: dict[str, TaskDefinition] = {
    "asr": TaskDefinition(
        code="asr",
        label="ASR",
        aliases=frozenset(
            {
                "asr",
                "automatic-speech-recognition",
                "speech-recognition",
                "speech recognition",
                "speech-to-text",
                "stt",
            }
        ),
    ),
    "nmt": TaskDefinition(
        code="nmt",
        label="Traduction",
        aliases=frozenset(
            {
                "nmt",
                "translation",
                "machine-translation",
                "machine translation",
                "mt",
                "traduction",
            }
        ),
    ),
    "ner": TaskDefinition(
        code="ner",
        label="NER",
        aliases=frozenset(
            {
                "ner",
                "named-entity-recognition",
                "named entity recognition",
            }
        ),
    ),
    "classification": TaskDefinition(
        code="classification",
        label="Classification",
        aliases=frozenset(
            {
                "classification",
                "text-classification",
                "text classification",
                "sentiment-analysis",
                "sentiment analysis",
            }
        ),
    ),
    "tts": TaskDefinition(
        code="tts",
        label="TTS",
        aliases=frozenset({"tts", "text-to-speech", "text to speech"}),
    ),
    "summarization": TaskDefinition(
        code="summarization",
        label="Résumé",
        aliases=frozenset(
            {
                "summarization",
                "summarisation",
                "summarisation-de-texte",
                "text-summarization",
                "summary",
                "résumé",
                "resume",
            }
        ),
    ),
    UNKNOWN_TASK_CODE: TaskDefinition(
        code=UNKNOWN_TASK_CODE,
        label="Inconnu",
        aliases=frozenset(),
    ),
}

_ALIAS_INDEX: dict[str, str] = {}
for definition in TASK_VOCABULARY.values():
    if definition.code == UNKNOWN_TASK_CODE:
        continue
    _ALIAS_INDEX[definition.code] = definition.code
    for alias in definition.aliases:
        _ALIAS_INDEX[_normalize_alias(alias)] = definition.code


def get_task_label(code: str) -> str:
    definition = TASK_VOCABULARY.get(code)
    return definition.label if definition else TASK_VOCABULARY[UNKNOWN_TASK_CODE].label


def resolve_task_code(raw_tag: str) -> str | None:
    normalized = _normalize_alias(raw_tag)
    if not normalized:
        return None
    return _ALIAS_INDEX.get(normalized)
