"""Datasets extraits de l'inventaire Afrilang.pdf (août 2026)."""

from dataclasses import dataclass

from core.models import Provenance
from core.schemas import DatasetInput, LanguageInput, SourceInput

_HF = SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co")
_GITHUB = SourceInput(slug="github", name="GitHub", base_url="https://github.com")
_ZENODO = SourceInput(slug="zenodo", name="Zenodo", base_url="https://zenodo.org")
_MOZILLA = SourceInput(
    slug="mozilla-data-collective",
    name="Mozilla Data Collective",
    base_url="https://mozilladatacollective.com",
)
_ACL = SourceInput(slug="aclanthology", name="ACL Anthology", base_url="https://aclanthology.org")
_ARXIV = SourceInput(slug="arxiv", name="arXiv", base_url="https://arxiv.org")
_DOAJ = SourceInput(slug="doaj", name="DOAJ", base_url="https://doaj.org")
_SEMANTIC = SourceInput(slug="semanticscholar", name="Semantic Scholar", base_url="https://www.semanticscholar.org")
_EUROPMC = SourceInput(slug="europepmc", name="Europe PMC", base_url="https://europepmc.org")
_UMN = SourceInput(slug="umn", name="University of Minnesota", base_url="https://experts.umn.edu")
_MCGILL = SourceInput(slug="mcgill-nlp", name="McGill NLP", base_url="https://mcgill-nlp.github.io")


@dataclass(frozen=True)
class AfrilangRecord:
    external_id: str
    title: str
    description: str
    source: SourceInput
    source_url: str
    language_code: str
    language_raw: str
    data_format: str
    task_codes: tuple[str, ...]
    task_tags_raw: str
    size: str = "inconnu"


def _multi(language_raw: str) -> LanguageInput:
    return LanguageInput(code="und", name="Multilingue", family="inconnu", region="inconnu")


def _lang(code: str, name: str, *, family: str = "inconnu", region: str = "inconnu") -> LanguageInput:
    return LanguageInput(code=code, name=name, family=family, region=region)


def afrilang_records() -> list[AfrilangRecord]:
    return [
        # — Table 1 : textuels —
        AfrilangRecord(
            external_id="AfriNLP/AfricanFineTranslations-sentences",
            title="African Fine Translations",
            description="Corpus de phrases pour la traduction automatique.",
            source=_HF,
            source_url="https://huggingface.co/datasets/AfriNLP/AfricanFineTranslations-sentences",
            language_code="und",
            language_raw="Afr Latn, etc.",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="AfriNLP/AfriNLLB-train-distilled",
            title="AfriNLLB-train-distilled",
            description="Dataset curaté pour l'entraînement des modèles AfriNLLB.",
            source=_HF,
            source_url="https://huggingface.co/datasets/AfriNLP/AfriNLLB-train-distilled",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="African-Languages-Lab/multi-open",
            title="African Languages Lab Multi-Open",
            description="Texte parallèle anglais-langue cible pour 31 langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/datasets/African-Languages-Lab/multi-open",
            language_code="und",
            language_raw="31 langues africaines",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="nehahumbe/mafand",
            title="MAFAND-MT",
            description=(
                "Benchmark de traduction automatique pour les langues africaines "
                "dans le domaine de l'actualité, couvrant 21 langues."
            ),
            source=_HF,
            source_url="https://huggingface.co/datasets/nehahumbe/mafand",
            language_code="und",
            language_raw="Amharique, Bambara, Ghomala, Ewe, Fon, Haoussa, Igbo, Kinyarwanda, etc.",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="tonative/xnli-extension",
            title="XNLI Extension for African Languages",
            description="Extension du corpus XNLI pour l'inférence en langues naturelles (NLI).",
            source=_HF,
            source_url="https://huggingface.co/datasets/tonative/xnli-extension",
            language_code="und",
            language_raw="Haoussa, Igbo, Kikuyu, Yoruba",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="natural-language-inference",
        ),
        AfrilangRecord(
            external_id="masakhane/masakhaner-x",
            title="MasakhaNER-X",
            description="Agrégation des datasets MasakhaNER 1.0 et 2.0 pour 20 langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/datasets/masakhane/masakhaner-x",
            language_code="und",
            language_raw="20 langues africaines",
            data_format="text",
            task_codes=("ner",),
            task_tags_raw="named-entity-recognition",
        ),
        AfrilangRecord(
            external_id="Kencorpus/KenCorpus_text",
            title="Kencorpus",
            description="Corpus kenyan de textes et de discours pour le NLP.",
            source=_HF,
            source_url="https://huggingface.co/datasets/Kencorpus/KenCorpus_text",
            language_code="und",
            language_raw="Swahili, Dholuo, Luhya",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="text-classification",
        ),
        AfrilangRecord(
            external_id="masakhane/AfriDocMT",
            title="AFRIDOC-MT",
            description="Corpus de traduction multilingue au niveau du document.",
            source=_HF,
            source_url="https://huggingface.co/datasets/masakhane/AfriDocMT",
            language_code="und",
            language_raw="Anglais, Amharique, Haoussa, Swahili, Yoruba, Zoulou",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="afrimmt-ea",
            title="AfriMMT-EA",
            description=(
                "Dataset de traduction automatique multilingue à grande échelle "
                "couvrant 53 langues d'Afrique de l'Est."
            ),
            source=_UMN,
            source_url="https://experts.umn.edu/en/publications/afrimmt-ea",
            language_code="und",
            language_raw="53 langues d'Afrique de l'Est",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="adja-french-parallel-corpus",
            title="Adja-French Parallel Corpus",
            description="Premier corpus parallèle pour la traduction automatique de l'Adja.",
            source=_ACL,
            source_url="https://aclanthology.org/2024.loresmt-1.18/",
            language_code="ajg",
            language_raw="Adja, Français",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="dholuo-english-parallel-corpus",
            title="Dholuo–English Parallel Corpus",
            description="Corpus parallèle Dholuo-Anglais de 20 000 paires de phrases.",
            source=_DOAJ,
            source_url="https://doaj.org/article/10.11648/j.ijll.20240302.12",
            language_code="luo",
            language_raw="Dholuo, Anglais",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="amidblue/AfriQuAD",
            title="AfriQuAD",
            description="Dataset pour les tâches de Question-Réponse (QA) dans différentes langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/datasets/amidblue/AfriQuAD",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="question-answering",
        ),
        AfrilangRecord(
            external_id="kenlumachiquad",
            title="KenLumachiQuAD",
            description="Dataset de QA pour la langue Luhya Lumarachi du Kenya.",
            source=SourceInput(
                slug="mendeley-data",
                name="Mendeley Data",
                base_url="https://data.mendeley.com",
            ),
            source_url="https://data.mendeley.com/datasets/b6bybwnpxh",
            language_code="und",
            language_raw="Luhya Lumarachi",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="question-answering",
        ),
        AfrilangRecord(
            external_id="uhura-benchmark",
            title="Uhura",
            description=(
                "Benchmark pour l'évaluation du QA scientifique et de la véracité "
                "dans 6 langues africaines."
            ),
            source=_MCGILL,
            source_url="https://mcgill-nlp.github.io/uhura/",
            language_code="und",
            language_raw="6 langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="question-answering",
        ),
        AfrilangRecord(
            external_id="McGill-NLP/AfroBench",
            title="AfroBench",
            description=(
                "Benchmark à grande échelle pour évaluer les LLM sur 64 langues "
                "africaines et 15 tâches NLP."
            ),
            source=_GITHUB,
            source_url="https://github.com/McGill-NLP/AfroBench",
            language_code="und",
            language_raw="64 langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="benchmark",
        ),
        AfrilangRecord(
            external_id="McGill-NLP/Injongo",
            title="Injongo",
            description="Benchmark conversationnel pour 16 langues africaines.",
            source=_GITHUB,
            source_url="https://github.com/McGill-NLP/Injongo",
            language_code="und",
            language_raw="16 langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="conversational-benchmark",
        ),
        AfrilangRecord(
            external_id="michsethowusu/afri-emotion-datasets",
            title="Africa Emotion Datasets",
            description="Collection de données textuelles annotées en émotions pour les langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/collections/michsethowusu/afri-code-datasets",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="emotion-classification",
        ),
        AfrilangRecord(
            external_id="michsethowusu/mt650-parallel-sentences",
            title="African-English Parallel Sentences (MT650)",
            description="Paires de phrases parallèles pour la traduction.",
            source=_HF,
            source_url="https://huggingface.co/collections/michsethowusu/afri-code-datasets",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="michsethowusu/mossi-sentiments-corpus",
            title="Mossi Sentiment Corpus",
            description="Corpus de sentiments en langue Mossi.",
            source=_HF,
            source_url="https://huggingface.co/datasets/michsethowusu/mossi-sentiments-corpus",
            language_code="mos",
            language_raw="Mossi",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="sentiment-analysis",
        ),
        AfrilangRecord(
            external_id="Svngoku/afrisenti-kikongo-translated",
            title="AfriSenti-Kikongo-translated",
            description="Dataset de sentiments pour le Kikongo.",
            source=_HF,
            source_url="https://huggingface.co/datasets/Svngoku/afrisenti-kikongo-translated",
            language_code="kon",
            language_raw="Kikongo",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="sentiment-analysis",
        ),
        AfrilangRecord(
            external_id="hausamoviereview",
            title="HausaMovieReview",
            description="Dataset de sentiments pour le Haoussa, basé sur des commentaires YouTube.",
            source=_ARXIV,
            source_url="https://arxiv.org/abs/2509.16256",
            language_code="hau",
            language_raw="Haoussa",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="sentiment-analysis",
        ),
        AfrilangRecord(
            external_id="kanurisenti",
            title="KanuriSenti",
            description="Dataset de sentiments pour le Kanuri.",
            source=SourceInput(
                slug="mendeley-data",
                name="Mendeley Data",
                base_url="https://data.mendeley.com",
            ),
            source_url="https://data.mendeley.com/datasets/pcfvh7r6nd",
            language_code="kau",
            language_raw="Kanuri",
            data_format="text",
            task_codes=("classification",),
            task_tags_raw="sentiment-analysis",
        ),
        # — Table 2 : audio —
        AfrilangRecord(
            external_id="google/WaxalNLP",
            title="WAXAL (Google Research)",
            description=(
                "Large corpus ASR (1 250 h) et TTS (20 h+) pour 21 langues "
                "d'Afrique subsaharienne."
            ),
            source=_HF,
            source_url="https://huggingface.co/datasets/google/WaxalNLP",
            language_code="und",
            language_raw="Acholi, Haoussa, Luganda, Yoruba, etc. (27 langues au total)",
            data_format="audio",
            task_codes=("asr", "tts"),
            task_tags_raw="automatic-speech-recognition, text-to-speech",
            size="1 250 h ASR / 20 h+ TTS",
        ),
        AfrilangRecord(
            external_id="dsfsi-anv/za-african-next-voices",
            title="Swivuriso (African Next Voices - ZA)",
            description=(
                "Dataset vocal multilingue de 3000 heures pour l'ASR en 7 langues sud-africaines."
            ),
            source=_HF,
            source_url="https://huggingface.co/datasets/dsfsi-anv/za-african-next-voices",
            language_code="und",
            language_raw="7 langues sud-africaines",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="automatic-speech-recognition",
            size="3000 h",
        ),
        AfrilangRecord(
            external_id="intronhealth/afrivox-transcribe",
            title="AfriVox-Transcribe",
            description="Benchmark ASR combinant des ensembles de test de 20 langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/datasets/intronhealth/afrivox-transcribe",
            language_code="und",
            language_raw="20 langues africaines",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="automatic-speech-recognition",
        ),
        AfrilangRecord(
            external_id="bibletts",
            title="BibleTTS",
            description="Corpus vocal haute fidélité pour la TTS en 10 langues d'Afrique subsaharienne.",
            source=_HF,
            source_url="https://huggingface.co/papers/2207.03546",
            language_code="und",
            language_raw="10 langues d'Afrique subsaharienne",
            data_format="audio",
            task_codes=("tts",),
            task_tags_raw="text-to-speech",
        ),
        AfrilangRecord(
            external_id="luhya-asr-data",
            title="Luhya ASR Data",
            description="Corpus vocal de 70 heures en Luhya.",
            source=_MOZILLA,
            source_url="https://mozilladatacollective.com/",
            language_code="und",
            language_raw="Luhya",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="automatic-speech-recognition",
            size="70 h",
        ),
        AfrilangRecord(
            external_id="zenodo/6342622",
            title="DVox (Dvoice)",
            description="Dataset ASR pour les langues et dialectes africains.",
            source=_ZENODO,
            source_url="https://zenodo.org/record/6342622",
            language_code="und",
            language_raw="Wolof, Mandingue, Serere, Pulaar, etc.",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="automatic-speech-recognition",
        ),
        AfrilangRecord(
            external_id="keyword-spotting-african-languages",
            title="Keyword Spotting with African Languages",
            description="Extension du dataset Speech Commands avec 6 langues sénégalaises.",
            source=_ZENODO,
            source_url="https://zenodo.org/record/6365432",
            language_code="und",
            language_raw="Wolof, Pulaar, Serer, Mandinka, Diola, Soninke",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="keyword-spotting",
        ),
        AfrilangRecord(
            external_id="synthetic-text-corpus-african-asr",
            title="Synthetic Text Corpus for African Language ASR",
            description="13 488 phrases synthétiques pour l'ASR dans 10 langues africaines.",
            source=_MOZILLA,
            source_url="https://mozilladatacollective.com/",
            language_code="und",
            language_raw="Bambara, Chichewa, Haoussa, Kanuri, Luo, Nande, Somali, Twi, Wolof, Yoruba",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="automatic-speech-recognition",
        ),
        AfrilangRecord(
            external_id="adamawa-fulfulde-french-parallel",
            title="Adamawa Fulfulde–French Parallel Corpus",
            description="1 977 lignes de narratifs Fulfulde avec traductions françaises.",
            source=_MOZILLA,
            source_url="https://mozilladatacollective.com/",
            language_code="ful",
            language_raw="Fulfulde, Français",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        # — Table 3 : benchmarks et ressources —
        AfrilangRecord(
            external_id="masakhane/irokobench",
            title="IrokoBench",
            description=(
                "Benchmark traduit manuellement pour 16 langues africaines (NLI, MMLU, MGSM)."
            ),
            source=_HF,
            source_url="https://huggingface.co/collections/masakhane/irokobench",
            language_code="und",
            language_raw="16 langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="benchmark",
        ),
        AfrilangRecord(
            external_id="masakhane-io/masakhane-nlu",
            title="Masakhane-NLU",
            description=(
                "Projet de création de datasets de benchmark pour AfricaNLI, AfricaMGSM, AfricaMMLU."
            ),
            source=_GITHUB,
            source_url="https://github.com/masakhane-io/masakhane-nlu",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="benchmark",
        ),
        AfrilangRecord(
            external_id="dsfsi/dsfsi-datasets",
            title="DSFSI Public Datasets Registry",
            description="Catalogue complet de 50+ datasets pour les langues sud-africaines et africaines.",
            source=_GITHUB,
            source_url="https://github.com/dsfsi/dsfsi-datasets",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("inconnu",),
            task_tags_raw="registry",
        ),
        AfrilangRecord(
            external_id="michsethowusu/african-speech-text-datasets",
            title="African Speech-Text Datasets",
            description="Collection de datasets speech-text pour les langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/collections/michsethowusu/afri-code-datasets",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="audio",
            task_codes=("asr",),
            task_tags_raw="speech-text",
        ),
        AfrilangRecord(
            external_id="michsethowusu/african-african-parallel-sentences",
            title="African-African Parallel Sentences",
            description="Paires de phrases parallèles entre langues africaines.",
            source=_HF,
            source_url="https://huggingface.co/collections/michsethowusu/afri-code-datasets",
            language_code="und",
            language_raw="Multiples langues africaines",
            data_format="text",
            task_codes=("nmt",),
            task_tags_raw="machine-translation",
        ),
        AfrilangRecord(
            external_id="iadh-datasets-mozilla",
            title="Datasets IADH (Mozilla Data Collective)",
            description="38 datasets originaux couvrant plus de 20 langues africaines.",
            source=_MOZILLA,
            source_url="https://mozilladatacollective.com/",
            language_code="und",
            language_raw="Adamawa Fulfulde, etc.",
            data_format="audio",
            task_codes=("inconnu",),
            task_tags_raw="community-datasets",
        ),
    ]


def record_to_dataset_input(record: AfrilangRecord) -> DatasetInput:
    if record.language_code == "und":
        language = _multi(record.language_raw)
    else:
        language = _lang(record.language_code, record.language_raw.split(",")[0].strip())

    return DatasetInput(
        external_id=record.external_id,
        title=record.title,
        description=record.description,
        source=record.source,
        language=language,
        language_raw=record.language_raw,
        provenance=Provenance.MANUEL,
        source_url=record.source_url,
        data_format=record.data_format,
        size=record.size,
        task_codes=list(record.task_codes),
        task_tags_raw=record.task_tags_raw,
    )


def seed_afrilang_inventory(session) -> tuple[int, int]:
    """Insère l'inventaire Afrilang (idempotent par source + external_id)."""
    from sqlmodel import select

    from core.models import Dataset, Source
    from ingestion.service import IngestionService

    service = IngestionService(session)
    created = 0
    updated = 0

    for record in afrilang_records():
        statement = (
            select(Dataset)
            .join(Source)
            .where(Source.slug == record.source.slug, Dataset.external_id == record.external_id)
        )
        existed = session.exec(statement).first() is not None
        service.persist_dataset(record_to_dataset_input(record))
        if existed:
            updated += 1
        else:
            created += 1

    return created, updated
