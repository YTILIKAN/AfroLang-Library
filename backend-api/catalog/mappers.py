from catalog.api_schemas import (
    DatasetDetailResponse,
    DatasetSummaryResponse,
    LanguageResponse,
    LicenseResponse,
    SourceResponse,
    TaskResponse,
)
from core.models import Dataset, UNKNOWN


def dataset_to_summary(dataset: Dataset) -> DatasetSummaryResponse:
    return DatasetSummaryResponse(
        id=dataset.id,  # type: ignore[arg-type]
        external_id=dataset.external_id,
        title=dataset.title,
        description=dataset.description,
        language=LanguageResponse(
            code=dataset.language.code,
            name=dataset.language.name,
            family=dataset.language.family,
            region=dataset.language.region,
        ),
        language_raw=dataset.language_raw,
        source=SourceResponse(
            slug=dataset.source.slug,
            name=dataset.source.name,
            base_url=dataset.source.base_url,
        ),
        license=(
            LicenseResponse(
                name=dataset.license.name,
                spdx_id=dataset.license.spdx_id,
                url=dataset.license.url,
            )
            if dataset.license
            else None
        ),
        provenance=dataset.provenance.value,
        data_format=dataset.data_format,
        size=dataset.size,
        source_url=dataset.source_url,
        tasks=[TaskResponse(code=task.code, label=task.label) for task in dataset.tasks],
        published_at=dataset.published_at,
    )


def dataset_to_detail(dataset: Dataset) -> DatasetDetailResponse:
    summary = dataset_to_summary(dataset)
    return DatasetDetailResponse(
        **summary.model_dump(),
        created_at=dataset.created_at,
        updated_at=dataset.updated_at,
    )
