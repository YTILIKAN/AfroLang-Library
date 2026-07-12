# Contrats d'interface — AfroLang-Library

> Story 1.3 — contrats figés pour permettre le développement parallèle des 3 voies (Ingestion, Catalogue/API, Frontend).

| Contrat | Fichier de référence | Implémentation |
| --- | --- | --- |
| Connecteur de source | [connector-contract.md](./connector-contract.md) | `backend-api/ingestion/connectors/` |
| API `catalog` | [catalog-api.md](./catalog-api.md) | `backend-api/catalog/api_schemas.py` + bouchon `catalog/stub.py` |

## Bouchon API catalog

Par défaut, l'API utilise l'**implémentation réelle** (`CATALOG_STUB=false`) avec seed automatique au démarrage si l'index est vide.

Pour revenir au bouchon (frontend sans base) :

```env
CATALOG_STUB=true
CATALOG_AUTO_SEED=false
```

```powershell
# Backend
cd backend-api
.\.venv\Scripts\uvicorn main:app --reload --port 8000

# Exemples
curl "http://127.0.0.1:8000/catalog/datasets/search?language=yoruba"
curl "http://127.0.0.1:8000/catalog/datasets/1"
```

Documentation interactive : http://127.0.0.1:8000/docs

## Basculer vers l'API réelle

```env
CATALOG_STUB=false
```

L'implémentation réelle complète arrive en Story 1.11 ; le contrat JSON reste identique.
