# Contrat de filtrage — API `catalog` (Story 2.1)

> Gouverné par FR-12, AD-3, AD-8. Complète [catalog-api.md](./catalog-api.md).

Schémas Pydantic : `backend-api/catalog/api_schemas.py` (`DatasetFilterResponse`, `AppliedFiltersResponse`)  
Bouchon : `backend-api/catalog/stub.py` → `filter_datasets()`

Base URL (local) : `http://127.0.0.1:8000/catalog`

---

## GET `/datasets/filter`

Filtre les datasets par **langue**, **source**, **tâche NLP** et **format de données**. Les filtres sont combinés en **ET** logique : un dataset doit satisfaire tous les filtres fournis.

Les filtres opèrent sur les **valeurs normalisées** :
- langue → code ISO 639-3 (`swh`, pas `swahili` brut)
- tâche → vocabulaire contrôlé (`asr`, `nmt`, `classification`, …)
- source → slug (`huggingface`, `kaggle`)
- format → valeur normalisée (`text`, `audio`, …)

### Paramètres

| Nom | In | Type | Obligatoire | Description |
| --- | --- | --- | --- | --- |
| `language` | query | `string` | non* | Code ISO 639-3 ou alias/nom |
| `source` | query | `string` | non* | Slug de la source |
| `task` | query | `string` | non* | Code ou alias de tâche NLP |
| `data_format` | query | `string` | non* | Format de données normalisé |

\* Au moins **un** des quatre paramètres est requis. Sinon : `400`.

Alias tâche acceptés (exemples) : `ASR`, `automatic-speech-recognition` → `asr` ; `machine-translation` → `nmt`.

### Réponse `200` — `DatasetFilterResponse`

```json
{
  "filters": {
    "language": "Swahili",
    "language_code": "swh",
    "source": null,
    "task": "ASR",
    "task_code": "asr",
    "data_format": null
  },
  "total": 0,
  "datasets": []
}
```

### Réponse `400`

```json
{
  "detail": "Au moins un filtre requis : language, source, task ou data_format."
}
```

---

## Exemples

```bash
# Yoruba + ASR uniquement (1 dataset)
curl "http://127.0.0.1:8000/catalog/datasets/filter?language=yor&task=asr"

# Swahili + classification (1 dataset)
curl "http://127.0.0.1:8000/catalog/datasets/filter?language=Swahili&task=classification"

# Swahili + ASR → aucun résultat (intersection vide)
curl "http://127.0.0.1:8000/catalog/datasets/filter?language=Swahili&task=ASR"

# Source Hugging Face + format audio
curl "http://127.0.0.1:8000/catalog/datasets/filter?source=huggingface&data_format=audio"
```

---

## Frontend (Story 2.4)

Consommer l'endpoint sans accès direct à la base :

```typescript
const params = new URLSearchParams({ language: "Swahili", task: "ASR" });
const res = await fetch(`${API_URL}/catalog/datasets/filter?${params}`);
const data: DatasetFilterResponse = await res.json();
```

Bouchon disponible via `CATALOG_STUB=true` pour démarrer avant l'implémentation réelle.
