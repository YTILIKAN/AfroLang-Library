from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from core.fts import init_fts5
from core.models import Dataset, Provenance
from core.schemas import DatasetInput, LanguageInput, LicenseInput, SourceInput
from ingestion.repository import IngestionRepository


def _create_engine(db_path: Path):
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    init_fts5(engine)
    return engine


@pytest.fixture()
def engine(tmp_path: Path):
    eng = _create_engine(tmp_path / "atomicity.db")
    yield eng
    eng.dispose()


def _payload(external_id: str, language_code: str = "yor") -> DatasetInput:
    return DatasetInput(
        external_id=external_id,
        title=f"Dataset {external_id}",
        source=SourceInput(slug="huggingface", name="Hugging Face", base_url="https://huggingface.co"),
        language=LanguageInput(code=language_code, name="Yoruba", family="Niger-Congo", region="West Africa"),
        language_raw="Yorùbá",
        provenance=Provenance.SYNCHRONISE,
        source_url=f"https://huggingface.co/datasets/{external_id}",
        license=LicenseInput(name="CC BY 4.0"),
        task_codes=["asr"],
        task_tags_raw="automatic-speech-recognition",
    )


def test_write_batch_commits_once_for_the_whole_batch(engine) -> None:
    with Session(engine) as session:
        commit_calls = 0
        original_commit = session.commit

        def counting_commit():
            nonlocal commit_calls
            commit_calls += 1
            return original_commit()

        session.commit = counting_commit  # type: ignore[method-assign]

        repository = IngestionRepository(session)
        saved = repository.write_batch([_payload("ds-1"), _payload("ds-2"), _payload("ds-3")])

        assert len(saved) == 3
        assert commit_calls == 1, "un batch de 3 datasets ne doit produire qu'un seul commit"


def test_write_batch_is_visible_atomically_to_other_sessions(engine) -> None:
    with Session(engine) as session:
        IngestionRepository(session).write_batch([_payload("ds-a"), _payload("ds-b")])

    with Session(engine) as reader:
        datasets = reader.exec(select(Dataset)).all()
        assert {d.external_id for d in datasets} == {"ds-a", "ds-b"}


def test_write_batch_rolls_back_entirely_on_failure(engine) -> None:
    with Session(engine) as session:
        repository = IngestionRepository(session)
        original_sync = repository._sync_dataset_fts

        def failing_sync(dataset: Dataset) -> None:
            if dataset.external_id == "bad-dataset":
                raise RuntimeError("échec simulé")
            return original_sync(dataset)

        repository._sync_dataset_fts = failing_sync  # type: ignore[method-assign]

        with pytest.raises(RuntimeError, match="échec simulé"):
            repository.write_batch(
                [_payload("good-1"), _payload("bad-dataset"), _payload("good-2")]
            )

        # Après rollback, même "good-1" (flushé avec succès avant l'échec) ne doit
        # pas être visible — le batch entier est retombé, jamais un état partiel.
        remaining = session.exec(select(Dataset)).all()
        assert remaining == []


def test_failed_batch_does_not_affect_previously_committed_data(engine) -> None:
    with Session(engine) as session:
        IngestionRepository(session).write_batch([_payload("stable-1"), _payload("stable-2")])

    with Session(engine) as session:
        repository = IngestionRepository(session)
        original_sync = repository._sync_dataset_fts

        def failing_sync(dataset: Dataset) -> None:
            if dataset.external_id == "stable-3":
                raise RuntimeError("échec simulé")
            return original_sync(dataset)

        repository._sync_dataset_fts = failing_sync  # type: ignore[method-assign]

        with pytest.raises(RuntimeError):
            repository.write_batch([_payload("stable-3")])

    with Session(engine) as reader:
        datasets = reader.exec(select(Dataset)).all()
        assert {d.external_id for d in datasets} == {"stable-1", "stable-2"}
