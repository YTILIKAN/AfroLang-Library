# API publique v1 — AfroLang-Library (Story 2.3)

> Gouverné par FR-15, AD-3, AD-10. Surface stable pour développeurs externes et frontend.

**Base URL (local)** : `http://127.0.0.1:8000/api/v1`  
**Documentation lecteur** : page `/api-docs` du frontend (rédigée, versionnée avec l'app)  
**Schéma OpenAPI** : http://127.0.0.1:8000/openapi.json — explorateur : http://127.0.0.1:8000/docs  
**Manifeste** : `GET /api/v1`

Alias interne (même comportement) : `/catalog/*`

---

## Principes

| Règle | Détail |
| --- | --- |
| Lecture seule | Uniquement des requêtes **GET** — aucune écriture (AD-10) |
| JSON normalisé | Métadonnées au schéma commun (`DatasetSummaryResponse`) |
| Redirection | Chaque dataset inclut `source_url` vers la source d'origine |
| Cohérence | Même requête → même ensemble que l'interface web (même backend) |
| Version | `v1.0.0` — breaking changes futurs → `/api/v2` |

---

## Endpoints

| Méthode | Chemin | Story | Description |
| --- | --- | --- | --- |
| GET | `/api/v1` | 2.3 | Manifeste API (version, endpoints) |
| GET | `/api/v1/datasets/search?language=` | 1.11 | Recherche par langue |
| GET | `/api/v1/datasets/filter?...` | 2.1 | Filtrage combiné (langue, source, tâche, format) |
| GET | `/api/v1/datasets/{id}` | 1.3 | Fiche dataset |
| GET | `/api/v1/languages/overview?language=` | 2.2 | Agrégation par langue |

Contrats détaillés :
- [catalog-api.md](./catalog-api.md) — recherche et fiche
- [catalog-filter-api.md](./catalog-filter-api.md) — filtrage
- [catalog-language-api.md](./catalog-language-api.md) — agrégation

---

## Filtrage minimal (FR-15)

Recherche par langue :

```bash
curl "http://127.0.0.1:8000/api/v1/datasets/search?language=Swahili"
```

Filtrage par langue **et** tâche NLP :

```bash
curl "http://127.0.0.1:8000/api/v1/datasets/filter?language=swh&task=classification"
```

Chaque élément de `datasets[]` contient obligatoirement `source_url`.

---

## Intégration programme

```python
import httpx

BASE = "http://127.0.0.1:8000/api/v1"

# Filtrage langue + tâche
response = httpx.get(f"{BASE}/datasets/filter", params={"language": "yor", "task": "asr"})
response.raise_for_status()
payload = response.json()

for dataset in payload["datasets"]:
    assert dataset["source_url"].startswith("https://")
    print(dataset["title"], "→", dataset["source_url"])
```

---

## Bouchon

`CATALOG_STUB=true` — les routes `/api/v1` et `/catalog` renvoient les mêmes données factices.

---

## Ce qui n'est pas exposé

- Création / modification / suppression de datasets
- Gestion de comptes (`accounts` — Epic 3)
- Ingestion / administration

Ces surfaces d'écriture passent par des modules séparés, authentifiés (AD-10).
