# Architecture backend — AfroLang-Library

> Document de référence décrivant la structure interne de `backend/`, issue de la réflexion menée sur le choix d'architecture.

## Décision : monolithe modulaire

Une architecture en microservices (services séparés, déploiements indépendants, communication réseau entre services) ajoute un coût opérationnel (CI/CD multiple, monitoring distribué, gestion des pannes réseau) sans bénéfice mesurable à ce stade.

À la place, le backend est un **monolithe modulaire** : un seul déploiement, une seule base de code, mais organisée de façon à pouvoir extraire un module en service séparé plus tard si le besoin se confirme.

Deux principes se superposent dans cette organisation :

- **Vertical — organisation par domaine métier.** Le code est découpé en modules indépendants (`catalog`, `ingestion`, `scheduler`), chacun responsable d'un domaine du produit.
- **Horizontal — architecture en couches.** À l'intérieur de chaque module, le code est découpé par responsabilité technique (présentation, logique métier, accès aux données, structure des données).

Un module ne communique jamais directement avec les fichiers internes d'un autre module (pas d'import de `repository.py` ou `models.py` d'un module vers un autre).

---

## Structure du dépôt

```
backend-api/
├── core/
│   ├── config.py
│   ├── database.py
│   └── logging.py
│
├── catalog/
│   ├── routes.py
│   ├── service.py
│   ├── repository.py
│   └── models.py
│
├── ingestion/
│   ├── service.py
│   ├── repository.py
│   └── models.py
│
├── scheduler/
│   └── jobs.py
│
└── main.py
```

---

## Les couches, module par module

### `catalog/` — recherche et exposition des données

| Couche | Fichier | Rôle |
|---|---|---|
| Présentation | `routes.py` | Expose l'API REST (`/datasets`, `/languages`, etc.). Reçoit les requêtes HTTP, valide l'entrée, appelle `service.py`. |
| Service | `service.py` | Logique métier : règles de filtrage, validations, orchestration. |
| Repository | `repository.py` | Traduit les besoins du service en requêtes base de données (recherche, filtres, pagination). |
| Modèles | `models.py` | Définit la structure des tables (`Dataset`, `Language`, `Source`, `License`). |

C'est le seul module qui expose une API REST — c'est lui que le frontend et tout client externe (y compris un futur module de benchmarking) consomment.

### `ingestion/` — récupération et normalisation des données

| Couche | Fichier | Rôle |
|---|---|---|
| Service | `service.py` | Connecteurs vers les sources externes (Hugging Face, Kaggle, Zindi, Masakhane, OPUS), normalisation, validation des métadonnées. |
| Repository | `repository.py` | Écrit les datasets validés dans la base. |
| Modèles | `models.py` | Structure des tables propres à l'ingestion (`IngestionLog`, `SyncStatus`, etc.). |

Pas de couche présentation : `ingestion` n'est jamais appelé par une requête HTTP externe, seulement déclenché en interne par `scheduler`.

### `scheduler/` — déclenchement périodique

| Fichier | Rôle |
|---|---|
| `jobs.py` | Définit les tâches et leur fréquence, déclenche `ingestion/service.py` à intervalle régulier. |

Pas de `repository.py` ni `models.py` : `scheduler` ne possède pas de données propres au démarrage. Pas de couche présentation non plus : il n'expose rien, il s'auto-déclenche sur une minuterie interne.

> Cette structure minimale est volontaire — elle évite d'imposer aux modules des couches qu'ils n'utilisent pas, juste pour respecter une symétrie artificielle avec `catalog`.

---

## `core/` — la couche infrastructure

`core/` n'est pas un module métier — c'est la couche transversale dont tous les modules dépendent pour leurs besoins techniques génériques :

- `config.py` — variables d'environnement, paramètres de l'application
- `database.py` — connexion PostgreSQL, gestion des sessions
- `logging.py` — configuration des logs

`core/` ne connaît aucun concept métier (dataset, langue, tâche) — il fournit uniquement la plomberie technique. Les modules s'y connectent verticalement, mais ne communiquent jamais entre eux à travers `core/`.

---

## Comment les modules communiquent entre eux

### `catalog` ↔ `ingestion` : communication indirecte, via la base de données

`ingestion` écrit des données en base. `catalog` les lit. Les deux ignorent mutuellement leur existence — la base de données PostgreSQL est leur seul point de rencontre.

```
ingestion/service.py → ingestion/repository.py → core/database.py → PostgreSQL
                                                                          ↓
                          catalog/repository.py ← core/database.py ← (lecture)
```

Avantage : si la logique interne d'`ingestion` change complètement, `catalog` continue de fonctionner tant que la structure de la table reste compatible.

### `scheduler` → `ingestion` : le seul appel direct entre modules

`scheduler` doit explicitement déclencher `ingestion` à intervalle régulier — une communication indirecte par base de données ne fonctionnerait pas ici.


Règle : un module ne peut appeler que le `service.py` d'un autre module, jamais son `repository.py` ou ses `models.py` directement. `service.py` est l'unique porte d'entrée officielle d'un module.

### Frontend / clients externes : uniquement via l'API REST

Le frontend (et tout futur client externe comme un module de benchmarking) ne communique **jamais** directement avec la base de données. Le seul chemin possible :

```
Frontend → catalog/routes.py (API REST) → catalog/service.py → catalog/repository.py → core/database.py → PostgreSQL
```

Un système externe au projet (ex. projet de benchmarking avec sa propre base de données) ne doit jamais accéder directement à PostgreSQL — il consomme l'API REST exposée par `catalog`, exactement comme le frontend.

---

## `models.py` vs `repository.py` — distinction clé

Ces deux fichiers travaillent ensemble mais ont des responsabilités strictement séparées :

| | `models.py` | `repository.py` |
|---|---|---|
| Répond à | À quoi ressemble la donnée ? | Comment on interagit avec la donnée ? |
| Contient | Structure des tables (champs, types, relations) | Opérations (recherche, insertion, mise à jour) |
| Dépendance | Indépendant — ne connaît aucune autre couche | Dépend de `models.py`, l'utilise pour ses requêtes |

`repository.py` importe et utilise les structures définies dans `models.py` ; il ne les redéfinit pas. D'autres couches (`service.py`, parfois `routes.py`) peuvent aussi avoir besoin de connaître la structure d'un `Dataset` — c'est pourquoi `models.py` est une couche à part entière, et non un sous-élément de `repository.py`.

---

## Bases de données : une seule base PostgreSQL partagée

Décision : **une seule base PostgreSQL**, avec des tables séparées par module, plutôt que 3 bases physiquement distinctes.

Raisons :
- Le volume de données prévu ne justifie pas un partitionnement physique pour des raisons de performance.
- Une base partagée avec des tables et modèles séparés par module offre déjà une isolation logique suffisante.
- 3 bases séparées ajouteraient un coût opérationnel (connexions, sauvegardes, monitoring multiples) sans bénéfice identifié à ce stade.
- Si un découplage plus fort devient nécessaire plus tard, le changement reste localisé : seuls `core/database.py` et les fichiers `repository.py` concernés évoluent, pas la logique métier (`service.py`).

Cas différent — systèmes externes (ex. projet de benchmarking) : pas de base partagée, pas de connexion directe. La communication passe par l'API REST, qui constitue déjà l'interface réutilisable nécessaire.

---

## Recherche

Démarrer avec la recherche full-text native de PostgreSQL plutôt que d'introduire un moteur dédié (Elasticsearch, Meilisearch) dès le départ. Migrer uniquement si la recherche devient un goulot d'étranglement mesuré.

---


