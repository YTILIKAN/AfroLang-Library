from pydantic import BaseModel, Field

from core.schemas import DatasetInput


class NormalizationResult(BaseModel):
    """Résultat de la normalisation tâche + métadonnées (Story 1.7)."""

    dataset: DatasetInput
    unmapped_task_tags: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    @property
    def needs_review(self) -> bool:
        return bool(self.unmapped_task_tags or self.warnings)
