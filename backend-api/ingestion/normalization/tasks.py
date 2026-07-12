from ingestion.normalization.vocabulary import UNKNOWN_TASK_CODE, resolve_task_code


def normalize_task_tags(raw_tags: list[str]) -> tuple[list[str], list[str]]:
    """
    Mappe les tags bruts vers le vocabulaire contrôlé (FR-7, AD-8).

    Retourne (codes normalisés uniques, tags non mappés pour revue).
    """
    mapped: list[str] = []
    unmapped: list[str] = []

    for tag in raw_tags:
        code = resolve_task_code(tag)
        if code is None:
            unmapped.append(tag)
            continue
        if code not in mapped:
            mapped.append(code)

    if not mapped:
        mapped = [UNKNOWN_TASK_CODE]

    return mapped, unmapped
