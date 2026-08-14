# Voie Frontend des Epics 1 et 2 — Stories 1.12, 2.4 et 2.5

Note d'audit des trois dernières stories frontend restées en `review` sans vérification
indépendante. Même mode opératoire que [voie-frontend-epic-3.md](./voie-frontend-epic-3.md)
et [voie-frontend-epic-4.md](./voie-frontend-epic-4.md) : audit direct contre les critères
d'acceptation d'[epics.md](../epics/epics.md), sans fichier de story dédié.

Complète [pages-publiques-2.4-2.5.md](./pages-publiques-2.4-2.5.md), qui documentait
l'implémentation ; le présent document en vérifie la conformité.

## Contexte

Ces trois stories étaient passées en `review` sur déclaration du développeur, sans audit. Les
cinq autres stories frontend (3.4 à 3.6, 4.3 et 4.4) avaient depuis été auditées et avaient
chacune révélé au moins un écart, sauf 3.6 et 4.4 — d'où la vérification de celles-ci avant
clôture des epics.

## Vérification commune : AD-3

Les trois stories exigent que l'interface consomme l'API `catalog` sans accéder à la base.
**Conforme partout** : toute lecture publique passe par `lib/api/catalog.ts`, qui vise le
préfixe `/api/v1` en HTTP, avec `cache: "no-store"` et sans en-tête d'authentification
(AD-3, AD-10). Aucun accès direct à la base depuis `frontend-app/`.

## Story 1.12 — Fiche dataset et redirection

| Critère d'acceptation | Verdict |
| --- | --- |
| Fiche avec métadonnées normalisées : langue, tâche, taille/licence si connues, « inconnu » sinon (FR-13) | Écart corrigé — voir ci-dessous |
| Un clic redirige vers le dataset sur sa source d'origine | Conforme |
| Consomme l'API `catalog` sans accéder à la base (AD-3) | Conforme |

### Écart corrigé : la licence n'apparaissait pas sur la carte de résultat

`DatasetCard` affichait langue, tâches, format et taille — mais pas la licence, alors que
l'AC énumère « langue, tâche, **taille/licence** si connues ». La donnée était pourtant
disponible : `license: LicenseInfo | null` fait partie de `DatasetSummary`, et
`DatasetDetailView` l'affichait déjà correctement sur la page de détail.

L'AC se déclenche sur « quand l'interface web affiche **un résultat de recherche** » : la
« fiche » visée est donc la carte de résultat, pas la page `/datasets/[id]`. La licence a été
ajoutée à la carte, avec le même repli `displayValue()` → « inconnu » et la même atténuation
visuelle que le format et la taille.

### Redirection

Conforme dans les deux vues. La carte porte « Source externe ↗ » vers `source_url`, la fiche
détaillée un bouton « Ouvrir sur la source » ; les deux en `target="_blank"` avec
`rel="noopener noreferrer"`. Le titre de la carte mène à la fiche interne `/datasets/{id}`,
qui n'est pas la redirection exigée mais ne s'y substitue pas.

## Story 2.4 — Interface de filtres

| Critère d'acceptation | Verdict |
| --- | --- |
| Filtrer par source, tâche NLP et type/format, seuls ou combinés (FR-12) | Écart corrigé — voir ci-dessous |
| Les résultats affichés reflètent les filtres actifs | Conforme |
| Consomme l'API `catalog` sans accéder à la base (AD-3) | Conforme |

### Écart corrigé : la source `contribution` manquait au menu déroulant

`SOURCE_OPTIONS` était une liste codée en dur de trois slugs — `huggingface`, `kaggle`,
`manual`. Or `ContributorDatasetService.submit()` en pose deux :

```python
source_slug="manual" if manual else "contribution",
```

`contribution` désigne une contribution dont la source dispose d'une API, `manual` une source
qui n'en a pas (FR-5, Story 3.2). Le premier slug étant absent du menu, les datasets
contribués n'étaient pas filtrables par source depuis l'interface. Le backend, lui, accepte
n'importe quel slug — `normalize_source_slug()` ne valide contre aucune liste fermée : c'était
une omission purement côté interface.

Le défaut était invisible à ce jour, la base ne contenant que `huggingface` (517 datasets) et
`kaggle` (139), aucune contribution. Il se serait manifesté à la première soumission d'un
chercheur.

### Restitution des filtres

Conforme, et mieux que le minimum exigé : `ActiveFilterTags` restitue les filtres **tels que
le serveur les a résolus** (`Langue · Swahili (swh)`, `Tâche · ASR (asr)`) et non la saisie
brute, ce qui rend visible la normalisation. Le total et la liste suivent les filtres actifs.

Le filtre langue est présent en supplément des trois filtres exigés, et la combinaison en ET
logique est correcte.

## Story 2.5 — Page par langue

| Critère d'acceptation | Verdict |
| --- | --- |
| Liste des datasets de la langue et compteur (nombre, tâches couvertes) (FR-14) | Conforme |
| Chaque dataset cliquable, redirige vers sa source | Conforme — réutilise `DatasetCard` |
| Consomme l'API `catalog` sans accéder à la base (AD-3) | Conforme |

**Aucun écart.** `LanguageOverviewView` affiche `dataset_count`, `task_count` et les libellés
de `tasks_covered` en pastilles. Le cas d'une langue non reconnue est traité explicitement
(`language_code === "inconnu"` → titre dédié et compteurs masqués, plutôt que des zéros
trompeurs), ce que l'AC n'exigeait pas.

## Tests

Ajouté : `components/catalog/DatasetDetailView.test.tsx` — c'était le composant central de la
story 1.12 et le seul du dossier `catalog/` sans couverture. Il vérifie les métadonnées
normalisées, le repli « inconnu » sur cinq champs, la redirection externe sécurisée, le
masquage du libellé source brut inconnu et l'affichage conditionnel de la date de publication.

Étendu :

- `DatasetCard.test.tsx` — assertion sur la licence affichée, et le test de repli « inconnu »
  passe de deux à trois champs ;
- `DatasetFilterForm.test.tsx` — un test verrouille la présence des deux origines de
  contribution dans le menu Source.

`test/fixtures.ts` reçoit `buildDatasetDetail()`, qui étend `buildDataset()` des deux
horodatages d'indexation.

État : **97 tests frontend** et **98 tests backend** au vert, `npm run lint` et
`npm run build` propres.

## Clôture

Ces trois audits étaient les derniers en attente. Les huit stories qui étaient en `review`
(1.12, 2.4, 2.5, 3.4, 3.5, 3.6, 4.3, 4.4) sont passées à `done`, et les quatre epics à `done`.

Reste ouvert, signalé et non traité : le bouchon `admin_update_account` n'applique pas la
règle des 400 sur l'auto-désactivation, la route ne lui transmettant pas l'admin courant
(dette du bouchon de la story 4.2, détaillée dans
[voie-frontend-epic-4.md](./voie-frontend-epic-4.md)).
