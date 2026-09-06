import pytest

from core.config import get_settings


@pytest.fixture(autouse=True)
def disable_bootstrap_ingestion(monkeypatch: pytest.MonkeyPatch):
    """
    Neutralise les alimentations automatiques du `lifespan` pour toute la suite.

    Sans ce garde-fou, chaque `TestClient(app)` déclencherait un appel réseau réel vers
    Hugging Face et Kaggle au démarrage. Les tests d'ingestion ciblent les connecteurs
    directement, avec leurs propres doublures.

    `AFRILANG_AUTO_SEED` relève du même garde-fou : les fixtures posaient
    `CATALOG_AUTO_SEED=false` en pensant partir d'une base maîtrisée, mais l'inventaire
    Afrilang, lui, restait actif et injectait ses datasets dans la base de test — de quoi
    fausser tout décompte, au gré d'un inventaire qui bouge.

    `get_settings` est mémoïsé : sans vidage du cache avant *et* après, la variable posée
    ici n'aurait aucun effet dès qu'un import antérieur a déjà construit les réglages.
    """
    monkeypatch.setenv("CATALOG_BOOTSTRAP_INGEST", "false")
    monkeypatch.setenv("AFRILANG_AUTO_SEED", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
