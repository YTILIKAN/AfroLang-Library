from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.models import Dataset, DatasetTaskLink, Language, License, Source, Task, utc_now
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput, TaskInput


class IngestionRepository:
    """Écriture des métadonnées normalisées via l'ORM."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def upsert_language(self, payload: LanguageInput) -> Language:
        language = self.session.get(Language, payload.code)
        if language is None:
            language = Language(
                code=payload.code,
                name=payload.name,
                family=payload.family,
                region=payload.region,
            )
            self.session.add(language)
        else:
            language.name = payload.name
            language.family = payload.family
            language.region = payload.region
        self.session.commit()
        self.session.refresh(language)
        return language

    def upsert_source(self, payload: SourceInput) -> Source:
        statement = select(Source).where(Source.slug == payload.slug)
        source = self.session.exec(statement).first()
        if source is None:
            source = Source(slug=payload.slug, name=payload.name, base_url=payload.base_url)
            self.session.add(source)
        else:
            source.name = payload.name
            source.base_url = payload.base_url
        self.session.commit()
        self.session.refresh(source)
        return source

    def upsert_task(self, payload: TaskInput) -> Task:
        statement = select(Task).where(Task.code == payload.code)
        task = self.session.exec(statement).first()
        if task is None:
            task = Task(code=payload.code, label=payload.label)
            self.session.add(task)
        else:
            task.label = payload.label
        self.session.commit()
        self.session.refresh(task)
        return task

    def upsert_license(self, payload: LicenseInput) -> License:
        if payload.spdx_id:
            statement = select(License).where(License.spdx_id == payload.spdx_id)
            license_ = self.session.exec(statement).first()
        else:
            statement = select(License).where(License.name == payload.name)
            license_ = self.session.exec(statement).first()

        if license_ is None:
            license_ = License(name=payload.name, spdx_id=payload.spdx_id, url=payload.url)
            self.session.add(license_)
        else:
            license_.name = payload.name
            license_.url = payload.url
        self.session.commit()
        self.session.refresh(license_)
        return license_

    def save_dataset(self, payload: DatasetInput) -> Dataset:
        source = self.upsert_source(payload.source)
        language = self.upsert_language(payload.language)
        license_ = self.upsert_license(payload.license) if payload.license else None
        tasks = [self.upsert_task(TaskInput(code=code, label=code.upper())) for code in payload.task_codes]

        statement = select(Dataset).where(
            Dataset.source_id == source.id,
            Dataset.external_id == payload.external_id,
        )
        dataset = self.session.exec(statement).first()

        source_url = str(payload.source_url)
        now = utc_now()

        if dataset is None:
            dataset = Dataset(
                external_id=payload.external_id,
                title=payload.title,
                description=payload.description,
                source_id=source.id,
                language_code=language.code,
                language_raw=payload.language_raw,
                license_id=license_.id if license_ else None,
                provenance=payload.provenance,
                data_format=payload.data_format,
                size=payload.size,
                source_url=source_url,
                published_at=payload.published_at,
                created_at=now,
                updated_at=now,
            )
            self.session.add(dataset)
        else:
            dataset.title = payload.title
            dataset.description = payload.description
            dataset.language_code = language.code
            dataset.language_raw = payload.language_raw
            dataset.license_id = license_.id if license_ else None
            dataset.provenance = payload.provenance
            dataset.data_format = payload.data_format
            dataset.size = payload.size
            dataset.source_url = source_url
            dataset.published_at = payload.published_at
            dataset.updated_at = now

        self.session.commit()
        self.session.refresh(dataset)

        self._replace_dataset_tasks(dataset.id, tasks)
        self._sync_dataset_fts(dataset)
        self.session.commit()
        return self._load_dataset(dataset.id)

    def _load_dataset(self, dataset_id: int) -> Dataset:
        statement = (
            select(Dataset)
            .where(Dataset.id == dataset_id)
            .options(
                selectinload(Dataset.source),
                selectinload(Dataset.language),
                selectinload(Dataset.license),
                selectinload(Dataset.tasks),
            )
        )
        return self.session.exec(statement).one()

    def _replace_dataset_tasks(self, dataset_id: int, tasks: list[Task]) -> None:
        existing_links = self.session.exec(
            select(DatasetTaskLink).where(DatasetTaskLink.dataset_id == dataset_id)
        ).all()
        for link in existing_links:
            self.session.delete(link)

        for task in tasks:
            self.session.add(DatasetTaskLink(dataset_id=dataset_id, task_id=task.id))
        self.session.commit()

    def _sync_dataset_fts(self, dataset: Dataset) -> None:
        if self.session.bind is None or self.session.bind.dialect.name != "sqlite":
            return

        self.session.execute(
            text("DELETE FROM dataset_fts WHERE dataset_id = :dataset_id"),
            {"dataset_id": dataset.id},
        )
        self.session.execute(
            text(
                """
                INSERT INTO dataset_fts (dataset_id, title, description, language_code, language_raw)
                VALUES (:dataset_id, :title, :description, :language_code, :language_raw)
                """
            ),
            {
                "dataset_id": dataset.id,
                "title": dataset.title,
                "description": dataset.description,
                "language_code": dataset.language_code,
                "language_raw": dataset.language_raw,
            },
        )
