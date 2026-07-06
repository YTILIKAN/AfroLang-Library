# Répartition des stories entre 3 devs — AfroLang-Library

> Objectif : permettre à 3 développeurs de travailler **en parallèle sans se bloquer**.
> Principe : un **zéro-dépendance absolu est impossible** (il existe un socle incompressible). Mais ce plan garantit qu'**à l'intérieur d'une même vague, les 3 stories sont mutuellement indépendantes** — toute dépendance ne pointe que vers une vague **déjà terminée**, et le frontend développe toujours contre un **contrat + bouchon**.

## Les 3 voies (propriété des stories)

Chaque dev possède une voie alignée sur un module (limite les conflits de fichiers). ~8 stories chacun + le socle partagé.

| Dev | Voie / modules | Stories possédées |
|---|---|---|
| **Dev 1** | Ingestion (`ingestion/`) + contributions backend | 1.4, 1.5, 1.6, 1.8, 1.9, 1.10, 3.2, 3.3 |
| **Dev 2** | Catalogue/API (`catalog/`) + Comptes/Admin (`accounts/`) | 1.7, 1.11, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2 |
| **Dev 3** | Frontend (`frontend-app/`) | 1.12, 2.4, 2.5, 3.4, 3.5, 3.6, 4.3, 4.4 |
| **Socle** | commun (Dev 1 + Dev 2 en binôme, Dev 3 en appui) | 1.1, 1.2, 1.3 |

## Les 2 points de synchronisation (les seuls moments d'attente collective)

- **Sync ① — après 1.3** : contrat de connecteur + contrat de l'API `catalog` + bouchon prêts → ouvre les 3 voies de l'Epic 1/2.
- **Sync ② — après 3.1** : entité `Account` + contrat de l'API `accounts` + bouchon prêts → ouvre les voies des Epics 3/4.

Entre deux syncs, personne n'attend personne.

## Planning par vagues (chaque colonne = travail parallèle simultané)

| Vague | Dev 1 (Ingestion) | Dev 2 (Catalog/Accounts) | Dev 3 (Frontend) |
|---|---|---|---|
| **0 — Socle** | 1.1 → 1.2 → 1.3 (binôme avec Dev 2) | 1.1 → 1.2 → 1.3 (binôme avec Dev 1) | Environnement + coquille Next.js + repérage APIs HF/Kaggle & données ISO 639-3/Glottolog |
| — | **↑ SYNC ① : contrats `catalog` + bouchon prêts** | | |
| **1** | 1.4 Connecteur HF | 1.11 Recherche API (sur données de test) | 1.12 Fiche + redirection (contre bouchon) |
| **2** | 1.5 Connecteur Kaggle | 1.7 Normalisation tâche | Composants UI de résultats (prépare 2.4/2.5) |
| **3** | 1.6 Normalisation langue | 2.1 Endpoint de filtrage (+ publie son contrat) | Consolidation UI recherche |
| **4** | 1.8 Écriture + màj atomique | 2.2 Endpoint agrégation par langue (+ contrat) | 2.4 Interface de filtres (bouchon 2.1) |
| **5** | 1.9 Retrait des disparus | 2.3 API publique documentée | 2.5 Page par langue (bouchon 2.2) |
| **6** | 1.10 Déclenchement à la demande | 3.1 Comptes + auth + contrat `accounts` | Intègre l'API `catalog` réelle (remplace les bouchons) |
| — | **↑ SYNC ② : contrat `accounts` + bouchon prêts** | | |
| **7** | 3.2 Contribution (provenance) | 4.1 CRUD admin datasets (API) | 3.4 Interface d'authentification (bouchon 3.1) |
| **8** | 3.3 Gère ses propres datasets | 4.2 Gestion des comptes (API) | 3.5 Interface de soumission (bouchon 3.2) |
| **9** | 4.3 Interface admin datasets (renfort front) | 4.4 Interface gestion comptes (renfort front) | 3.6 Interface « mes datasets » |

À la vague 9, le backend est terminé : Dev 1 et Dev 2 viennent en **renfort sur le frontend** (4.3, 4.4) pour finir en même temps que Dev 3. En variante, ils peuvent plutôt prendre le durcissement sécurité (NFR-2), l'observabilité (NFR-4) et les tests.

## Règles de coordination (pour ne jamais se bloquer)

1. **Le contrat avant le code.** Toute story backend qui expose une interface (connecteur, endpoint) **publie sa forme d'entrée/sortie en premier** (premier critère d'acceptation). Le frontend démarre alors sur un **bouchon**, puis bascule sur l'implémentation réelle sans changer son code d'appel.
2. **Une voie = un module.** Chacun reste majoritairement dans son module (`ingestion/`, `catalog/`+`accounts/`, `frontend-app/`) → très peu de conflits Git. Les entités partagées (`core/`) sont figées une seule fois en 1.2 / 3.1.
3. **Dépendances uniquement vers le passé.** Une story ne dépend jamais d'une story de la **même vague** ni d'une vague ultérieure — uniquement de vagues déjà terminées.
4. **Deux seuls rendez-vous bloquants** : Sync ① (contrats `catalog`) et Sync ② (contrat `accounts`). Le reste coule en parallèle.

## Rappel des dépendances inter-voies (à surveiller aux jointures)

- `1.8` (Dev 1) a besoin de `1.6` (Dev 1) **et** `1.7` (Dev 2) → planifié pour que 1.7 soit fini avant (vague 2 < vague 4).
- `3.2` (Dev 1) a besoin de `3.1` (Dev 2) → après Sync ②.
- Tout le frontend d'un epic (Dev 3) consomme les contrats publiés par Dev 1/Dev 2 la vague précédente.
