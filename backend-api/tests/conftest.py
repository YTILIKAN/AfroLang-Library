import pytest

from core.config import get_settings


@pytest.fixture(autouse=True)
def disable_bootstrap_ingestion(monkeypatch: pytest.MonkeyPatch):
    """
    Neutralise l'ingestion initiale du `lifespan` pour toute la suite.

    Sans ce garde-fou, chaque `TestClient(app)` déclencherait un appel réseau réel vers
    Hugging Face et Kaggle au démarrage. Les tests d'ingestion ciblent les connecteurs
    directement, avec leurs propres doublures.

    `get_settings` est mémoïsé : sans vidage du cache avant *et* après, la variable posée
    ici n'aurait aucun effet dès qu'un import antérieur a déjà construit les réglages.
    """
    monkeypatch.setenv("CATALOG_BOOTSTRAP_INGEST", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
