# Interface publique — stories 2.4 et 2.5

Note de livraison des deux pages publiques de consultation de l'index : la recherche filtrée
(`/recherche`, story 2.4) et la disponibilité par langue (`/langues`, story 2.5).

## Périmètre livré

| Story | Critère d'acceptation | Où c'est réalisé |
|---|---|---|
| 2.4 | Filtrer par source, tâche NLP et format, seuls ou combinés (FR-12) | `components/FilterControls.tsx`, `lib/api/catalog.ts` |
| 2.4 | Les résultats affichés reflètent les filtres actifs | `lib/api/catalog.ts` (`fetchDatasetResults`), `app/recherche/page.tsx` |
| 2.5 | Liste des datasets d'une langue + compteurs (FR-14) | `components/LanguageOverview.tsx`, `app/langues/page.tsx` |
| 2.5 | Chaque dataset est cliquable et redirige vers sa source | `components/DatasetCard.tsx` |
| 2.4 / 2.5 | Consommation de l'API `catalog`, aucun accès base (AD-3) | `lib/api/client.ts` — uniquement des `GET /catalog/*` |

## Pages

### `/recherche` — recherche et filtres

Composant serveur. Les critères transitent par l'URL (formulaire `method="get"`), ce qui rend
chaque état de recherche partageable et rechargeable.

| Paramètre | Valeurs | Exemple |
|---|---|---|
| `language` | code ISO 639-3 ou nom/alias | `swahili`, `swh`, `Yorùbá` |
| `source` | slug de source | `huggingface`, `kaggle` |
| `task` | code du vocabulaire contrôlé | `asr`, `nmt`, `ner`, `classification`, `tts`, `summarization` |
| `data_format` | format normalisé | `audio`, `text`, `inconnu` |

Règle d'appel, portée par `fetchDatasetResults` :

- aucun critère → aucune requête, message d'invitation ;
- langue seule → `GET /catalog/datasets/search` (FR-11) ;
- tout autre cas → `GET /catalog/datasets/filter` (FR-12), avec les seuls paramètres renseignés.

### `/langues` — disponibilité par langue

Même principe, un seul paramètre `language`, un seul appel :
`GET /catalog/languages/overview`. La page affiche le nom et le code ISO de la langue, sa famille
et sa région, les compteurs (`dataset_count`, `task_count`), les tâches couvertes, puis la liste
des fiches.

Une langue absente de l'index n'est pas une erreur : le backend renvoie `language: null`,
`language_code: "inconnu"` et des compteurs à zéro ; la page l'annonce explicitement.

## Conventions frontend consolidées

Le merge des stories 4.3/4.4 (interfaces d'administration) a apporté des conventions que ces deux
pages suivent désormais.

- **Types** — `lib/types.ts` est la source unique, alignée sur `catalog/api_schemas.py` :
  `DatasetSummary`, `LanguageInfo`, `TaskInfo`, `SourceInfo`, `LicenseInfo`, plus les enveloppes
  de réponse (`DatasetSearchResponse`, `DatasetFilterResponse`, `LanguageOverviewResponse`).
- **Appels HTTP** — tout passe par `apiRequest` (`lib/api/client.ts`), qui construit l'URL à
  partir de `API_URL` (`lib/config.ts`) et lève une `ApiError` portant le statut. Les lectures
  publiques utilisent `{ cache: "no-store" }` et ne demandent aucune authentification.
- **Organisation** — un module par domaine sous `lib/api/` : `catalog.ts` (lecture publique),
  `accounts.ts` (écritures authentifiées).
- **Style** — fond `zinc-50`, surfaces blanches, texte `zinc-900`/`zinc-600`, accent
  `emerald-700`, `rounded-lg`/`rounded-xl`. Pas de variantes `dark:`.

## Vocabulaire des filtres

Les options de `FilterControls` reproduisent le vocabulaire contrôlé du backend
(`ingestion/normalization/vocabulary.py`). Toute évolution de ce vocabulaire doit être répercutée
dans ce composant — le test `FilterControls.test.tsx` vérifie chaque code.

Le format `inconnu` est proposé volontairement : c'est une valeur réellement stockée quand la
source ne renseigne pas le format (FR-8), et non l'absence de filtre.

## Tests

`npm test` (Vitest + Testing Library, environnement jsdom).

| Fichier | Ce qu'il couvre |
|---|---|
| `lib/api/catalog.test.ts` | URLs appelées, encodage, absence de cache, `ApiError`, choix de l'endpoint selon les critères |
| `components/FilterControls.test.tsx` | Présence des filtres, noms de champs, vocabulaire complet, présélection |
| `components/DatasetResultList.test.tsx` | État vide, une fiche par dataset, accord du compteur |
| `components/DatasetCard.test.tsx` | Métadonnées normalisées, repli « inconnu », redirection sécurisée |
| `components/LanguageOverview.test.tsx` | Identité de la langue, compteurs, tâches couvertes, langue inconnue |

Les fixtures partagées sont dans `test/fixtures.ts` et reproduisent le bouchon backend
(`catalog/stub.py`).

Les pages elles-mêmes ne sont pas testées unitairement : ce sont des composants serveur `async`,
non montables par Testing Library. Toute la logique qu'elles portaient a été extraite dans
`fetchDatasetResults` et dans les composants de présentation, qui sont testés.

## Vérification manuelle

```bash
cd backend-api && ./.venv/Scripts/python.exe -m uvicorn main:app --port 8000
cd frontend-app && npm run dev
```

- `/recherche?language=swahili&task=asr` — combinaison langue + tâche
- `/recherche?source=kaggle` — filtre seul, sans langue
- `/langues?language=swahili` — compteurs et tâches couvertes
- `/langues?language=zzz` — langue inconnue, page affichée sans erreur

Pour travailler sans base peuplée, lancer le backend avec `CATALOG_STUB=true` : les routes
`catalog` répondent alors depuis le bouchon `catalog/stub.py`.
