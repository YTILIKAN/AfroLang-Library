# Voie Frontend de l'Epic 3 — Stories 3.4, 3.5 et 3.6

Note de reconciliation et d'achèvement de la voie Frontend de l'Epic 3 (comptes et
contributions), rédigée après le merge de `main` dans `stelle`.

## Contexte : deux interfaces en parallèle

La PR #37 (`7f1eba4`, « Refonte UI Parallel et frontend public/contribution ») avait déjà
livré sur `main` une refonte complète du frontend *et* une première implémentation des
stories 3.4 à 3.6. En parallèle, la branche `stelle` portait les stories 2.4 et 2.5 avec
l'ancienne charte (zinc/emerald) et ses propres routes françaises.

Le merge a laissé trois points à traiter :

| Fichier | Nature |
| --- | --- |
| `app/page.tsx` | Conflit marqué — deux pages d'accueil |
| `lib/api/catalog.ts` | Conflit marqué — deux clients catalogue |
| `lib/types.ts` | **Auto-merge silencieux et invalide** : `DatasetSearchResponse`, `DatasetFilterResponse`, `LanguageAggregationStats` et `LanguageOverviewResponse` déclarées deux fois, sans marqueur de conflit |

Le troisième cas est le plus dangereux : aucun marqueur, mais le module ne compilait plus.

## Décision : la refonte de `main` devient canonique

Les routes de `main` sont conservées ; les routes françaises équivalentes de `stelle` sont
supprimées, avec les composants racine qu'elles utilisaient.

| Supprimé | Remplacé par |
| --- | --- |
| `app/recherche/` | `app/search/` |
| `app/langues/` | `app/languages/` et `app/languages/[language]/` |
| `components/DatasetCard.tsx` | `components/catalog/DatasetCard.tsx` |
| `components/DatasetResultList.tsx` | Grilles de `DatasetCard` dans les pages |
| `components/FilterControls.tsx` | `components/catalog/DatasetFilterForm.tsx` |
| `components/LanguageOverview.tsx` | `components/catalog/LanguageOverviewView.tsx` |
| `lib/search-params.ts` | `searchParams` typés par page |
| `fetchDatasetResults()` | `/search` et `/filter` appellent directement `searchDatasets` / `filterDatasets` |

Les critères d'acceptation des stories 2.4 et 2.5 restent couverts : le filtrage combiné
(FR-12) par `/filter` + `DatasetFilterForm` + `ActiveFilterTags`, la page par langue (FR-14)
par `/languages/[language]` + `LanguageOverviewView`.

Les tests des composants supprimés ont été reportés sur leurs remplaçants
(`components/catalog/*.test.tsx`).

### Client catalogue

Les deux versions divergeaient sur le préfixe d'API. `main` visait `/api/v1`, `stelle`
visait `/catalog`. Les deux existent côté backend (`main.py`), mais `/api/v1` est la surface
publique stable et `/catalog` n'en est que l'alias interne : **`/api/v1` est retenu**.

La politique de lecture de `stelle` est conservée : toute lecture publique part avec
`cache: "no-store"` et sans en-tête d'authentification (AD-3, AD-10).

## Audit des stories 3.4, 3.5 et 3.6

### Story 3.4 — Interface d'authentification

Déjà couverte par `main` : `app/auth/login`, `app/auth/register`, `AuthProvider`,
`ResearcherGate`, déconnexion dans `SiteHeader`. Les pages de consultation restent des
composants serveur sans authentification.

**Écart corrigé :** `AdminLoginForm` pré-remplissait ses champs avec des identifiants
d'administration réels (`admin@afriland.org` / `admin123`). Les valeurs par défaut ont été
retirées.

### Story 3.5 — Interface de soumission d'un dataset

**Écart corrigé (le plus important).** Le formulaire proposait bien une case « Source sans
API publique », mais celle-ci se contentait d'**ajouter une note à la description**. L'entrée
gardait l'origine `contribué` : le backend forçait `Provenance.CONTRIBUE` sans exception, et
le contrat `SubmitDatasetRequest` n'offrait aucun moyen d'exprimer le cas.

Or l'Epic 3 demande explicitement, en 3.2 comme en 3.5, qu'une source sans API soit
référencée « par ce même mécanisme, **avec origine `manuel`** » (FR-5).

Correction de bout en bout :

- `SubmitDatasetRequest` reçoit un champ optionnel `manual_source: bool = False` ;
- `ContributorDatasetService.submit()` en dérive `Provenance.MANUEL` (et `source_slug`
  `manual`) au lieu de `CONTRIBUE` / `contribution` ;
- le bouchon `accounts/stub.py` suit la même règle ;
- `SubmitDatasetForm` envoie le drapeau et ne bricole plus la description.

Dans les deux cas la provenance reste rattachée au compte contributeur
(`contributor_account_id`), conformément à AD-15 : ces entrées ne sont jamais retirées par
l'ingestion automatique.

### Story 3.6 — Interface « mes datasets »

Déjà couverte et conforme : `MyDatasetsPanel` n'affiche que la réponse de
`/accounts/datasets/mine`, propose modification et suppression, et le refus d'accès à la
soumission d'un autre compte reste appliqué **côté serveur** (AD-14). Aucun écart.

## Tests

Ajoutés côté frontend (`vitest`) :

- `components/auth/AuthForms.test.tsx` — connexion, redirection, erreur serveur, compte désactivé
- `components/auth/RegisterForm.test.tsx` — création de compte puis session
- `components/auth/ResearcherGate.test.tsx` — accès refusé sans session, jeton périmé, déconnexion
- `components/contribute/SubmitDatasetForm.test.tsx` — dont le drapeau `manual_source`
- `components/contribute/MyDatasetsPanel.test.tsx` — liste, édition, suppression, refus 403
- `components/catalog/*.test.tsx` — tests reportés depuis les composants supprimés

Ajoutés côté backend (`pytest`) : `test_contributor_submit_source_without_api_is_manuel` et
`test_contributor_submit_without_manual_flag_defaults_to_contribue`.

État à la fin de la reconciliation : **67 tests frontend** et **95 tests backend** au vert,
`npm run lint` et `npm run build` propres.

## Point d'outillage

Le pool `forks` de Vitest n'arrive pas à démarrer ses workers depuis un chemin OneDrive
contenant espaces et apostrophes : la commande échouait sur un « Timeout waiting for worker
to respond » avant d'exécuter le moindre test. `vitest.config.mts` fixe donc
`pool: "threads"`, qui fonctionne sur les mêmes tests.

## Reste hors périmètre

La base locale `backend-api/aflang.db` conserve un schéma antérieur à la story 3.2 (colonne
`dataset.contributor_account_id` absente) : les routes catalog échouent en mode base réelle
tant qu'elle n'est pas recréée. Signalé depuis les stories 2.4/2.5, non traité ici.
