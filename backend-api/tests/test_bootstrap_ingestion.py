import logging
from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

import main
from core import models as core_models  # noqa: F401
from catalog.seed import seed_catalog
from core.config import get_settings
from core.fts import init_fts5
from core.models import Dataset
from ingestion import models as ingestion_models  # noqa: F401
from ingestion.connectors.base import SourceConnector
from ingestion.connectors.schemas import RawDatasetMetadata
from ingestion.models import SyncLog
from ingestion.repository import IngestionRepository


class _FakeHuggingFace(SourceConnector):
    calls = 0

    @property
    def source_slug(self) -> str:
        return "huggingface"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        type(self).calls += 1
        return [
            RawDatasetMetadata(
                external_id="fake/yoruba-asr",
                title="Fake Yoruba ASR",
                source_slug="huggingface",
                source_url="https://example.com/fake/yoruba-asr",
                language_raw="yo",
                task_tags_raw=["automatic-speech-recognition"],
            )
        ]


class _FakeKaggle(SourceConnector):
    @property
    def source_slug(self) -> str:
        return "kaggle"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        return [
            RawDatasetMetadata(
                external_id="fake-wolof-nmt",
                title="Fake Wolof NMT",
                source_slug="kaggle",
                source_url="https://example.com/fake-wolof-nmt",
                language_raw="wo",
                task_tags_raw=["translation"],
            )
        ]


class _FlakyKaggle(SourceConnector):
    """Kaggle indisponible au premier démarrage (réseau, identifiants), rétabli ensuite."""

    calls = 0

    @property
    def source_slug(self) -> str:
        return "kaggle"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        type(self).calls += 1
        if type(self).calls == 1:
            raise RuntimeError("Identifiants Kaggle absents (KAGGLE_USERNAME/KAGGLE_KEY)")
        return _FakeKaggle().fetch_raw_datasets()


@pytest.fixture()
def bootstrap_engine(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "bootstrap.db"
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    init_fts5(engine)

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    get_settings.cache_clear()

    from core import database

    monkeypatch.setattr(database, "engine", engine)
    monkeypatch.setattr(main, "HuggingFaceConnector", _FakeHuggingFace)
    monkeypatch.setattr(main, "KaggleConnector", _FakeKaggle)
    _FakeHuggingFace.calls = 0
    _FlakyKaggle.calls = 0

    yield engine

    engine.dispose()
    get_settings.cache_clear()


def test_bootstrap_populates_an_empty_database(bootstrap_engine, caplog):
    """Une base vierge se peuple seule au démarrage — parité dev/prod."""
    with caplog.at_level(logging.INFO, logger="main"):
        main._run_bootstrap_ingestion()

    # `_run_bootstrap_ingestion` avale ses propres exceptions pour ne jamais empêcher le
    # service de démarrer : sans cette assertion, une panne du bloc passerait inaperçue.
    errors = [record for record in caplog.records if record.levelno >= logging.ERROR]
    assert not errors, f"ingestion initiale en erreur : {[r.getMessage() for r in errors]}"

    with Session(bootstrap_engine) as session:
        datasets = session.exec(select(Dataset)).all()
        logs = session.exec(select(SyncLog)).all()

    assert {dataset.external_id for dataset in datasets} == {
        "fake/yoruba-asr",
        "fake-wolof-nmt",
    }
    assert {log.source_slug for log in logs} == {"huggingface", "kaggle"}
    assert all(log.success for log in logs)


def test_bootstrap_is_skipped_once_the_catalog_is_populated(bootstrap_engine):
    """Un redémarrage sur un catalogue peuplé ne relance aucun appel réseau."""
    main._run_bootstrap_ingestion()
    assert _FakeHuggingFace.calls == 1

    main._run_bootstrap_ingestion()

    assert _FakeHuggingFace.calls == 1, "l'ingestion a été relancée au second démarrage"

    with Session(bootstrap_engine) as session:
        datasets = session.exec(select(Dataset)).all()

    assert len(datasets) == 2


def test_bootstrap_retries_only_the_source_left_empty(bootstrap_engine, monkeypatch):
    """
    Une source en échec est reprise au démarrage suivant, sans réingérer les autres.

    Le succès d'un seul connecteur ne doit jamais figer le catalogue : sans reprise par
    source, une panne Kaggle au premier démarrage resterait définitive.
    """
    monkeypatch.setattr(main, "KaggleConnector", _FlakyKaggle)

    main._run_bootstrap_ingestion()

    with Session(bootstrap_engine) as session:
        assert {dataset.external_id for dataset in session.exec(select(Dataset)).all()} == {
            "fake/yoruba-asr"
        }
        logs = session.exec(select(SyncLog)).all()
    assert {log.source_slug: log.success for log in logs} == {
        "huggingface": True,
        "kaggle": False,
    }

    main._run_bootstrap_ingestion()

    assert _FakeHuggingFace.calls == 1, "la source déjà peuplée a été réingérée"
    assert _FlakyKaggle.calls == 2, "la source en échec n'a pas été reprise"

    with Session(bootstrap_engine) as session:
        assert {dataset.external_id for dataset in session.exec(select(Dataset)).all()} == {
            "fake/yoruba-asr",
            "fake-wolof-nmt",
        }


def test_bootstrap_repopulates_a_purged_catalog(bootstrap_engine):
    """Un catalogue vidé (volume recréé, purge) se repeuple au démarrage suivant."""
    main._run_bootstrap_ingestion()

    with Session(bootstrap_engine) as session:
        dataset_ids = [dataset.id for dataset in session.exec(select(Dataset)).all()]
        IngestionRepository(session).remove_datasets(dataset_ids)
        session.commit()

    main._run_bootstrap_ingestion()

    assert _FakeHuggingFace.calls == 2

    with Session(bootstrap_engine) as session:
        assert len(session.exec(select(Dataset)).all()) == 2


def test_demo_seed_does_not_suppress_the_real_ingestion(bootstrap_engine):
    """
    Le seed de démonstration ne doit jamais faire passer une source pour ingérée.

    `seed_catalog` écrit sous les slugs `huggingface` / `kaggle` avec la provenance
    `synchronisé` et s'exécute avant l'ingestion dans le `lifespan` : un garde-fou fondé
    sur la seule présence de datasets laisserait une base de production vide.
    """
    with Session(bootstrap_engine) as session:
        inserted = seed_catalog(session)
    assert inserted, "le seed de démonstration n'a rien écrit — test sans objet"

    main._run_bootstrap_ingestion()

    assert _FakeHuggingFace.calls == 1, "l'ingestion réelle a été court-circuitée par le seed"

    with Session(bootstrap_engine) as session:
        external_ids = {dataset.external_id for dataset in session.exec(select(Dataset)).all()}

    assert {"fake/yoruba-asr", "fake-wolof-nmt"} <= external_ids
