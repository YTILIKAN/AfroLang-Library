from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class RawDatasetMetadata(BaseModel):
    """Structure intermédiaire commune produite par tout connecteur de source (AD-6)."""

    external_id: str = Field(description="Identifiant du dataset sur la plateforme source")
    title: str
    source_slug: str = Field(description="Slug de la source (ex. huggingface, kaggle)")
    source_url: HttpUrl | str = Field(description="Lien de redirection vers le dataset sur la source")
    language_raw: str | list[str] | None = Field(
        default=None,
        description="Valeur(s) brute(s) de langue telle(s) que renvoyée(s) par la source",
    )
    task_tags_raw: list[str] = Field(default_factory=list, description="Tags de tâche bruts de la source")
    description_raw: str | None = None
    license_raw: str | None = None
    data_format_raw: str | None = None
    size_raw: str | None = None
    published_at_raw: str | None = Field(default=None, description="Date brute telle que renvoyée par la source")


class ConnectorFetchResult(BaseModel):
    """Résultat d'exécution d'un connecteur — traçabilité AD-13."""

    source_slug: str
    fetched_at: datetime
    datasets: list[RawDatasetMetadata] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)

    @property
    def success(self) -> bool:
        return not self.errors
