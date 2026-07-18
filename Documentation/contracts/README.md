# Contrats d'interface — AfroLang-Library

> Story 1.3 — contrats figés pour permettre le développement parallèle des 3 voies (Ingestion, Catalogue/API, Frontend).

| Contrat | Fichier de référence | Implémentation |
| --- | --- | --- |
| Connecteur de source | [connector-contract.md](./connector-contract.md) | `backend-api/ingestion/connectors/` |
| API `catalog` (recherche + fiche) | [catalog-api.md](./catalog-api.md) | `backend-api/catalog/api_schemas.py` + bouchon `catalog/stub.py` |
| API `catalog` (filtrage) | [catalog-filter-api.md](./catalog-filter-api.md) | `GET /catalog/datasets/filter` (Story 2.1) |
| API `catalog` (agrégation par langue) | [catalog-language-api.md](./catalog-language-api.md) | `GET /catalog/languages/overview` (Story 2.2) |
| **API publique v1** | [catalog-public-api.md](./catalog-public-api.md) | `/api/v1/*` (Story 2.3, FR-15) |
| **API `accounts`** | [accounts-api.md](./accounts-api.md) | `/accounts/*` (Story 3.1, FR-16) |

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
curl "http://127.0.0.1:8000/api/v1/datasets/search?language=yoruba"
curl "http://127.0.0.1:8000/api/v1/datasets/filter?language=yor&task=asr"
curl "http://127.0.0.1:8000/api/v1/datasets/1"
curl "http://127.0.0.1:8000/api/v1"
```

Documentation interactive : http://127.0.0.1:8000/docs

## Bouchon API accounts

Par défaut, l'authentification utilise l'**implémentation réelle** (`ACCOUNTS_STUB=false`) avec persistance SQLite.

Pour le bouchon (frontend sans logique métier contribution) :

```env
ACCOUNTS_STUB=true
```

```powershell
# Inscription / connexion
curl -X POST http://127.0.0.1:8000/accounts/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"user@example.com","password":"password123","display_name":"User"}'

curl -X POST http://127.0.0.1:8000/accounts/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"kofi@example.com","password":"password123"}'
```

## Basculer vers l'API réelle

```env
CATALOG_STUB=false
```

L'implémentation réelle complète arrive en Story 1.11 ; le contrat JSON reste identique.
