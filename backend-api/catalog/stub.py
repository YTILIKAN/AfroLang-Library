from datetime import datetime, timezone

from catalog.api_schemas import (
    DatasetDetailResponse,
    DatasetSearchResponse,
    DatasetSummaryResponse,
    LanguageResponse,
    LicenseResponse,
    SourceResponse,
    TaskResponse,
)
from core.language_codes import resolve_language_code
from core.models import UNKNOWN, Provenance

_STUB_DATASETS: list[DatasetDetailResponse] = [
    DatasetDetailResponse(
        id=1,
        external_id="masakhane/yoruba-asr",
        title="Yoruba ASR Corpus",
        description="Corpus de reconnaissance vocale en yoruba",
        language=LanguageResponse(code="yor", name="Yoruba", family="Niger-Congo", region="Afrique de l'Ouest"),
        language_raw="Yorùbá",
        source=SourceResponse(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
        license=LicenseResponse(name="CC BY 4.0", spdx_id="CC-BY-4.0", url="https://creativecommons.org/licenses/by/4.0/"),
        provenance=Provenance.SYNCHRONISE.value,
        data_format="audio",
        size="2.5 GB",
        source_url="https://huggingface.co/datasets/masakhane/yoruba-asr",
        tasks=[TaskResponse(code="asr", label="ASR")],
        published_at=datetime(2024, 3, 15, tzinfo=timezone.utc),
        created_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
    ),
    DatasetDetailResponse(
        id=2,
        external_id="african-voices/wolof-nmt",
        title="Wolof Parallel Corpus",
        description="Corpus parallèle wolof-français pour la traduction automatique",
        language=LanguageResponse(code="wol", name="Wolof", family="Niger-Congo", region="Afrique de l'Ouest"),
        language_raw="Wolof",
        source=SourceResponse(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
        license=LicenseResponse(name="MIT", spdx_id="MIT", url="https://opensource.org/licenses/MIT"),
        provenance=Provenance.SYNCHRONISE.value,
        data_format="text",
        size="120 MB",
        source_url="https://huggingface.co/datasets/african-voices/wolof-nmt",
        tasks=[TaskResponse(code="nmt", label="NMT")],
        published_at=datetime(2023, 11, 2, tzinfo=timezone.utc),
        created_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
    ),
    DatasetDetailResponse(
        id=3,
        external_id="swahili-news-classification",
        title="Swahili News Classification",
        description="Articles de presse swahili annotés pour la classification de texte",
        language=LanguageResponse(code="swh", name="Swahili", family="Bantoue", region="Afrique de l'Est"),
        language_raw="swahili",
        source=SourceResponse(slug="kaggle", name="Kaggle", base_url="https://www.kaggle.com"),
        license=LicenseResponse(name=UNKNOWN, spdx_id=None, url=UNKNOWN),
        provenance=Provenance.SYNCHRONISE.value,
        data_format="text",
        size="45 MB",
        source_url="https://www.kaggle.com/datasets/swahili-news-classification",
        tasks=[TaskResponse(code="classification", label="Classification")],
        published_at=None,
        created_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 10, tzinfo=timezone.utc),
    ),
]


def search_by_language(language_query: str) -> DatasetSearchResponse:
    language_code = resolve_language_code(language_query)
    if language_code is None:
        return DatasetSearchResponse(
            language_query=language_query,
            language_code=UNKNOWN,
            total=0,
            datasets=[],
        )

    matches = [
        DatasetSummaryResponse.model_validate(dataset.model_dump())
        for dataset in _STUB_DATASETS
        if dataset.language.code == language_code
    ]
    return DatasetSearchResponse(
        language_query=language_query,
        language_code=language_code,
        total=len(matches),
        datasets=matches,
    )


def get_dataset_detail(dataset_id: int) -> DatasetDetailResponse | None:
    for dataset in _STUB_DATASETS:
        if dataset.id == dataset_id:
            return dataset
    return None
