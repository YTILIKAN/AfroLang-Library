# Contrat de l'API `catalog` (Story 1.3)

> Gouverné par AD-3, AD-10, FR-11, FR-13. API publique en **lecture seule**, réponses **JSON**.

Schémas Pydantic : `backend-api/catalog/api_schemas.py`  
Bouchon : `backend-api/catalog/stub.py` (actif par défaut via `CATALOG_STUB=true`)

Base URL (local) : `http://127.0.0.1:8000/catalog`

---

## GET `/datasets/search`

Recherche de datasets par langue. La recherche s'appuie sur le **code canonique ISO 639-3** ; les alias (`Yoruba`, `Yorùbá`, `yor`) doivent retourner le même ensemble (résolution côté serveur).

### Paramètres

| Nom | In | Type | Obligatoire | Description |
| --- | --- | --- | --- | --- |
| `language` | query | `string` | oui | Code ISO 639-3 ou alias/nom de langue |

### Réponse `200` — `DatasetSearchResponse`

```json
{
  "language_query": "Yoruba",
  "language_code": "yor",
  "total": 1,
  "datasets": [
    {
      "id": 1,
      "external_id": "masakhane/yoruba-asr",
      "title": "Yoruba ASR Corpus",
      "description": "Corpus de reconnaissance vocale en yoruba",
      "language": {
        "code": "yor",
        "name": "Yoruba",
        "family": "Niger-Congo",
        "region": "Afrique de l'Ouest"
      },
      "language_raw": "Yorùbá",
      "source": {
        "slug": "huggingface",
        "name": "Hugging Face",
        "base_url": "https://huggingface.co"
      },
      "license": {
        "name": "CC BY 4.0",
        "spdx_id": "CC-BY-4.0",
        "url": "https://creativecommons.org/licenses/by/4.0/"
      },
      "provenance": "synchronisé",
      "data_format": "audio",
      "size": "2.5 GB",
      "source_url": "https://huggingface.co/datasets/masakhane/yoruba-asr",
      "tasks": [{ "code": "asr", "label": "ASR" }],
      "published_at": "2024-03-15T00:00:00Z"
    }
  ]
}
```

### Cas sans résultat

```json
{
  "language_query": "xyz",
  "language_code": "inconnu",
  "total": 0,
  "datasets": []
}
```

---

## GET `/datasets/{dataset_id}`

Fiche dataset avec métadonnées normalisées et lien de redirection (FR-13).

### Paramètres

| Nom | In | Type | Obligatoire |
| --- | --- | --- | --- |
| `dataset_id` | path | `integer` | oui |

### Réponse `200` — `DatasetDetailResponse`

Identique à `DatasetSummaryResponse` avec en plus :

| Champ | Type | Description |
| --- | --- | --- |
| `created_at` | `datetime` (ISO 8601) | Date d'entrée dans l'index |
| `updated_at` | `datetime` (ISO 8601) | Dernière mise à jour |

### Réponse `404`

```json
{ "detail": "Dataset introuvable" }
```

---

## Conventions

| Sujet | Convention |
| --- | --- |
| Métadonnée absente | Chaîne `"inconnu"` |
| Provenance | `"synchronisé"` · `"contribué"` · `"manuel"` |
| Code langue | ISO 639-3 dans `language.code` |
| Dates | ISO 8601 UTC |
| Contenu dataset | **Jamais** inclus — uniquement métadonnées + `source_url` |

## Bouchon (données factices)

Le bouchon expose 3 datasets de démonstration :

| ID | Langue | Source |
| --- | --- | --- |
| 1 | Yoruba (`yor`) | Hugging Face |
| 2 | Wolof (`wol`) | Hugging Face |
| 3 | Swahili (`swh`) | Kaggle |

Alias supportés : `yor`, `yoruba`, `yorùbá`, `wol`, `wolof`, `swh`, `swahili`, `swa`.

## Frontend

Consommer l'API via HTTP — jamais d'accès direct à la base (AD-3). Exemple :

```typescript
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/catalog/datasets/search?language=yoruba`
);
const data: DatasetSearchResponse = await res.json();
```

Variable d'environnement recommandée : `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
