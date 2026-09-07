# Contrat d'agrégation par langue — API `catalog` (Story 2.2)

> Gouverné par FR-14, AD-3. Complète [catalog-api.md](./catalog-api.md).

Schémas Pydantic : `LanguageOverviewResponse`, `LanguageAggregationStats`, `SupportedLanguagesResponse`  
Bouchon : `backend-api/catalog/stub.py` → `get_language_overview()`

Base URL (local) : `http://127.0.0.1:8000/catalog`

---

## GET `/languages`

Retourne le **vocabulaire des langues couvertes** : code canonique ISO 639-3 et nom
d'affichage, triés par nom. Alimente le sélecteur de langue des formulaires de
contribution et d'administration, ainsi que le message d'erreur `422` sur une langue
non reconnue.

La liste combine le registre statique `SUPPORTED_LANGUAGE_NAMES`
(`backend-api/core/language_codes.py`, source des noms d'affichage) et les codes déjà
présents dans la table `language` mais pas encore nommés dans le registre. Avec
`CATALOG_STUB=true`, seul le registre statique est servi.

Cette liste **guide** la saisie sans la fermer : un code ISO 639-3 valide mais absent de
l'index reste accepté à la soumission (voir
[accounts-admin-datasets-api.md](./accounts-admin-datasets-api.md)).

### Paramètres

Aucun.

### Réponse `200` — `SupportedLanguagesResponse`

```json
{
  "total": 20,
  "languages": [
    { "code": "amh", "name": "Amharique" },
    { "code": "nya", "name": "Chichewa" },
    { "code": "hau", "name": "Haoussa" }
  ]
}
```

---

## GET `/languages/overview`

Retourne, pour une langue donnée, **la liste de ses datasets** et des **compteurs basiques** :
- nombre de datasets référencés ;
- tâches NLP distinctes couvertes (vocabulaire contrôlé).

La langue est résolue comme pour la recherche (Story 1.11) : code ISO 639-3 ou alias (`Yoruba`, `yor`, `Yorùbá` → `yor`).

### Paramètres

| Nom | In | Type | Obligatoire | Description |
| --- | --- | --- | --- | --- |
| `language` | query | `string` | oui | Code ISO 639-3 ou alias/nom de langue |

### Réponse `200` — `LanguageOverviewResponse`

```json
{
  "language_query": "Yoruba",
  "language_code": "yor",
  "language": {
    "code": "yor",
    "name": "Yoruba",
    "family": "Niger-Congo",
    "region": "Afrique de l'Ouest"
  },
  "stats": {
    "dataset_count": 2,
    "task_count": 2,
    "tasks_covered": [
      { "code": "asr", "label": "ASR" },
      { "code": "classification", "label": "Classification" }
    ]
  },
  "datasets": []
}
```

> Le tableau `datasets` contient les fiches résumées complètes (même forme que la recherche).

### Langue inconnue

```json
{
  "language_query": "xyz",
  "language_code": "inconnu",
  "language": null,
  "stats": {
    "dataset_count": 0,
    "task_count": 0,
    "tasks_covered": []
  },
  "datasets": []
}
```

---

## Exemples

```bash
curl "http://127.0.0.1:8000/catalog/languages/overview?language=Yoruba"
curl "http://127.0.0.1:8000/catalog/languages/overview?language=swh"
```

---

## Frontend (Story 2.5)

Page dédiée par langue — consommer uniquement via l'API :

```typescript
const res = await fetch(
  `${API_URL}/catalog/languages/overview?language=${encodeURIComponent(language)}`
);
const overview: LanguageOverviewResponse = await res.json();
// overview.stats.dataset_count, overview.stats.tasks_covered, overview.datasets
```

Bouchon disponible via `CATALOG_STUB=true`.
