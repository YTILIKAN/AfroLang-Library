from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.normalization.metadata import normalize_language_raw, normalize_text
from ingestion.normalization.schemas import NormalizationResult
from ingestion.normalization.tasks import normalize_task_tags
from ingestion.normalization.vocabulary import UNKNOWN_TASK_CODE

from core.models import Provenance, UNKNOWN
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput


def normalize_dataset_metadata(
    raw: RawDatasetMetadata,
    *,
    language_code: str | None = None,
    language_name: str | None = None,
    provenance: Provenance = Provenance.SYNCHRONISE,
) -> NormalizationResult:
    """
    Normalise les tâches NLP et les métadonnées manquantes d'un dataset brut (FR-7, FR-8).

    La langue canonique est fournie par la Story 1.6 ; en son absence, le code « und »
    (indéterminé ISO 639-3) est utilisé pour ne pas bloquer le référencement.
    """
    task_codes, unmapped = normalize_task_tags(raw.task_tags_raw)
    task_tags_raw = ", ".join(raw.task_tags_raw) if raw.task_tags_raw else UNKNOWN
    warnings: list[str] = []

    for tag in unmapped:
        warnings.append(f"Tâche non mappable, en attente de revue : {tag!r}")

    resolved_language_code = language_code or "und"
    resolved_language_name = language_name or normalize_language_raw(raw.language_raw)

    license_name = normalize_text(raw.license_raw)
    license_input = LicenseInput(name=license_name, spdx_id=None, url=UNKNOWN)

    dataset = DatasetInput(
        external_id=raw.external_id,
        title=normalize_text(raw.title),
        source=SourceInput(slug=raw.source_slug, name=raw.source_slug, base_url=UNKNOWN),
        language=LanguageInput(
            code=resolved_language_code,
            name=resolved_language_name,
            family=UNKNOWN,
            region=UNKNOWN,
        ),
        language_raw=normalize_language_raw(raw.language_raw),
        provenance=provenance,
        source_url=str(raw.source_url),
        description=normalize_text(raw.description_raw),
        license=license_input,
        data_format=normalize_text(raw.data_format_raw),
        size=normalize_text(raw.size_raw),
        task_codes=task_codes,
        task_tags_raw=task_tags_raw,
        published_at=None,
    )

    if UNKNOWN_TASK_CODE in task_codes and raw.task_tags_raw:
        warnings.append("Aucune tâche mappable — tâche définie à « inconnu », dataset conservé.")

    return NormalizationResult(dataset=dataset, unmapped_task_tags=unmapped, warnings=warnings)
