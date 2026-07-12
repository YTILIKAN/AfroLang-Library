from sqlmodel import Session, select

from core.models import Dataset, Provenance
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
from ingestion.service import IngestionService


def _count_datasets(session: Session) -> int:
    return len(session.exec(select(Dataset)).all())


def seed_catalog(session: Session) -> int:
    """Insère un jeu de datasets de démonstration pour la recherche par langue (Story 1.11)."""
    service = IngestionService(session)
    samples = [
        DatasetInput(
            external_id="masakhane/yoruba-asr",
            title="Yoruba ASR Corpus",
            source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
            language=LanguageInput(code="yor", name="Yoruba", family="Niger-Congo", region="Afrique de l'Ouest"),
            language_raw="Yorùbá",
            provenance=Provenance.SYNCHRONISE,
            source_url="https://huggingface.co/datasets/masakhane/yoruba-asr",
            description="Corpus de reconnaissance vocale en yoruba",
            license=LicenseInput(name="CC BY 4.0", spdx_id="CC-BY-4.0", url="https://creativecommons.org/licenses/by/4.0/"),
            data_format="audio",
            size="2.5 GB",
            task_codes=["asr"],
            task_tags_raw="automatic-speech-recognition",
        ),
        DatasetInput(
            external_id="african-nlp/yoruba-text",
            title="Yoruba Text Collection",
            source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
            language=LanguageInput(code="yor", name="Yoruba", family="Niger-Congo", region="Afrique de l'Ouest"),
            language_raw="yor",
            provenance=Provenance.SYNCHRONISE,
            source_url="https://huggingface.co/datasets/african-nlp/yoruba-text",
            description="Corpus textuel yoruba",
            license=LicenseInput(name="MIT", spdx_id="MIT", url="https://opensource.org/licenses/MIT"),
            data_format="text",
            size="80 MB",
            task_codes=["classification"],
            task_tags_raw="text-classification",
        ),
        DatasetInput(
            external_id="african-voices/wolof-nmt",
            title="Wolof Parallel Corpus",
            source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
            language=LanguageInput(code="wol", name="Wolof", family="Niger-Congo", region="Afrique de l'Ouest"),
            language_raw="Wolof",
            provenance=Provenance.SYNCHRONISE,
            source_url="https://huggingface.co/datasets/african-voices/wolof-nmt",
            description="Corpus parallèle wolof-français",
            license=LicenseInput(name="MIT", spdx_id="MIT", url="https://opensource.org/licenses/MIT"),
            data_format="text",
            size="120 MB",
            task_codes=["nmt"],
            task_tags_raw="machine-translation",
        ),
        DatasetInput(
            external_id="swahili-news-classification",
            title="Swahili News Classification",
            source=SourceInput(slug="kaggle", name="Kaggle", base_url="https://www.kaggle.com"),
            language=LanguageInput(code="swh", name="Swahili", family="Bantoue", region="Afrique de l'Est"),
            language_raw="swahili",
            provenance=Provenance.SYNCHRONISE,
            source_url="https://www.kaggle.com/datasets/swahili-news-classification",
            description="Articles de presse swahili annotés",
            data_format="text",
            size="45 MB",
            task_codes=["classification"],
            task_tags_raw="text-classification",
        ),
    ]

    created = 0
    for payload in samples:
        service.persist_dataset(payload)
        created += 1
    return created


def seed_catalog_if_empty(session: Session) -> int:
    if _count_datasets(session) > 0:
        return 0
    return seed_catalog(session)
