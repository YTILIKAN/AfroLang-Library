---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-AfroLang-Library-2026-07-01/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-AfroLang-Library-2026-07-01/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/prds/prd-AfroLang-Library-2026-07-01/addendum.md'
  - '_bmad-output/planning-artifacts/briefs/brief-AfroLang-Library-2026-07-01/brief.md'
---

# AfroLang-Library - Epic Breakdown

## Overview

Ce document fournit le découpage complet en epics et stories pour AfroLang-Library, décomposant les exigences du PRD et les décisions d'architecture (spine) en stories implémentables. Pas de spec UX formelle à ce stade (négligée volontairement ; les stories UI sont dérivées du PRD).

## Requirements Inventory

### Functional Requirements

**Ingestion et normalisation**
- FR-1 : Connecteur de source — ingérer les Datasets d'une Source via son API ; ajouter une Source = ajouter un Connecteur (contrat commun). Ancrage HF + Kaggle.
- FR-2 : Déclenchement de l'ingestion — à la demande au MVP (pas de cron) ; automatisation planifiée = phase 2.
- FR-3 : Retrait des datasets disparus — à l'ingestion, un Dataset `synchronisé` absent de sa Source est retiré (les `contribué`/`manuel` ne sont pas touchés).
- FR-4 : Ajout des nouveaux datasets — un nouveau Dataset d'une Source devient consultable après ingestion + normalisation.
- FR-5 : Référencement manuel des sources sans API — via l'interface (contribution/admin), Provenance `manuel`.
- FR-6 : Normalisation de l'identité de langue — mapper la valeur brute vers le code canonique ISO 639-3 (Glottolog en repli), conserver la valeur brute.
- FR-7 : Normalisation de la tâche NLP — mapper le tag brut vers un vocabulaire contrôlé.
- FR-8 : Gestion des métadonnées manquantes — marquer « inconnu » et référencer quand même.

**Stockage**
- FR-9 : Persistance de l'Index — Métadonnées normalisées persistées durablement ; survit aux redémarrages ; source unique web + API.
- FR-10 : Mise à jour atomique par l'ingestion — jamais d'état partiel/vide visible pendant une ingestion.

**Consultation (web + API)**
- FR-11 : Recherche par langue — sur le code canonique (les variantes de nommage retournent le même ensemble).
- FR-12 : Filtres — par Source, Tâche NLP, type/format de données.
- FR-13 : Fiche dataset et redirection — afficher les Métadonnées + rediriger vers la Source.
- FR-14 : Page dédiée par langue — liste des Datasets + compteur basique (nb, tâches couvertes).
- FR-15 : Interrogation de l'index par API — API publique read-only, JSON, filtrage min. par Langue et Tâche NLP.

**Comptes, rôles, contributions, administration**
- FR-16 : Comptes et authentification — création de compte + connexion ; rôles Chercheur et Admin ; consultation sans compte.
- FR-17 : Contribution d'un dataset par un chercheur — soumission (métadonnées + lien) avec Provenance = son Compte.
- FR-18 : Un chercheur ne gère que ses propres contributions — voir/modifier/supprimer uniquement les siens.
- FR-19 : Administration des datasets (CRUD global) — l'Admin gère les références de tous les Datasets, quelle qu'en soit l'origine.
- FR-20 : Gestion des comptes — l'Admin crée, désactive, attribue les rôles.

### NonFunctional Requirements

- NFR-1 : Coût nul — stockage, exécution de l'ingestion, authentification et hébergement (à terme) gratuits. Aucune dépendance payante.
- NFR-2 : Sécurité — authentification des Comptes ; contrôle d'accès par rôle et propriété vérifié **côté serveur** (un Chercheur n'agit que sur ses données) ; protection de l'admin et de la surface d'écriture **avant tout déploiement public**.
- NFR-3 : Maintenabilité — maintenable par 3 personnes ; Connecteurs isolés (un connecteur cassé n'affecte pas les autres).
- NFR-4 : Observabilité — chaque ingestion laisse une trace (date, source, ajouts/retraits, erreurs) ; échec d'un connecteur **visible**, jamais silencieux.
- NFR-5 : Performance — recherche web et API dans un délai raisonnable sur le volume attendu de métadonnées. [Cibles à définir.]
- NFR-6 : Disponibilité — MVP en local ; pas de SLA en v1 ; consultation publique au déploiement.
- NFR-7 : Accessibilité / i18n — interface au minimum utilisable ; documentation en français. [Langue de l'interface FR/EN à confirmer.]

### Additional Requirements

*(Décisions d'architecture du spine — contraignent l'implémentation)*

- **Paradigme (AD-1, AD-2)** : monolithe modulaire ; modules `catalog`, `ingestion`, `accounts`, `scheduler` + `core/` ; couches `routes`/`service`/`repository`/`models` ; un module n'appelle que le `service.py` d'un autre.
- **Scaffolding / starter (Epic 1)** : structure `backend-api/` (Python, FastAPI 0.136.x) + `frontend-app/` (Next.js 16.2.x) + `.github/workflows/`. Pas de starter unique imposé ; initialisation à faire en tout début.
- **Entités partagées (AD-12)** : `Dataset`, `Language`, `Source`, `Task`, `License`, `Account` définis une seule fois dans `core/`.
- **Accès données (AD-4)** : via `repository` + ORM (SQLModel/SQLAlchemy) ; logique métier agnostique du stockage (garde-fou de réversibilité).
- **Stockage (provisoire)** : SQLite + FTS5 (recherche full-text native) ; à confirmer en équipe (Option A/B/C).
- **Connecteurs (AD-6)** : contrat commun, structure intermédiaire définie consommée par la normalisation.
- **Séparation lecture/écriture (AD-3, AD-10)** : lecture publique via API REST read-only de `catalog` (sans compte) ; écritures (contribution, admin, comptes) via `accounts` authentifié.
- **Contrôle d'accès (AD-14)** : rôles Chercheur/Admin, vérif côté serveur, jamais uniquement dans l'UI.
- **Provenance (AD-15)** : `synchronisé`/`contribué`/`manuel` ; le retrait auto (FR-3) ne touche que `synchronisé`.
- **Mise à jour atomique (AD-11)** + **observabilité/pas d'échec silencieux (AD-13)**.
- **Ingestion à la demande au MVP** ; cron GitHub Actions = **phase 2** (AD-5).
- **Auth gratuite (provisoire)** : Auth.js/NextAuth ou auth Supabase.
- **Déploiement différé** : MVP en local d'abord ; durcissement sécurité avant mise en ligne.

### UX Design Requirements

*(Aucune — pas de spec UX formelle à ce stade ; négligée volontairement.)*

### FR Coverage Map

- FR-1 : Epic 1 — Connecteurs de source (Hugging Face + Kaggle)
- FR-2 : Epic 1 — Déclenchement de l'ingestion à la demande
- FR-3 : Epic 1 — Retrait des datasets disparus (synchronisés)
- FR-4 : Epic 1 — Ajout des nouveaux datasets
- FR-5 : Epic 3 — Référencement manuel des sources sans API (via l'interface)
- FR-6 : Epic 1 — Normalisation de l'identité de langue (ISO 639-3 + Glottolog)
- FR-7 : Epic 1 — Normalisation de la tâche NLP (vocabulaire contrôlé)
- FR-8 : Epic 1 — Gestion des métadonnées manquantes (« inconnu »)
- FR-9 : Epic 1 — Persistance de l'Index
- FR-10 : Epic 1 — Mise à jour atomique par l'ingestion
- FR-11 : Epic 1 — Recherche par langue
- FR-12 : Epic 2 — Filtres (source, tâche, format)
- FR-13 : Epic 1 — Fiche dataset et redirection
- FR-14 : Epic 2 — Page dédiée par langue
- FR-15 : Epic 2 — Interrogation de l'index par API (lecture seule)
- FR-16 : Epic 3 — Comptes et authentification (rôles Chercheur/Admin)
- FR-17 : Epic 3 — Contribution d'un dataset par un chercheur (provenance)
- FR-18 : Epic 3 — Un chercheur ne gère que ses propres contributions
- FR-19 : Epic 4 — Administration des datasets (CRUD global)
- FR-20 : Epic 4 — Gestion des comptes

## Epic List

### Epic 1 : Socle et index consultable
Un visiteur peut rechercher une langue africaine et obtenir des fiches de datasets normalisés, à partir d'un Index peuplé à la demande depuis Hugging Face et Kaggle. Établit le squelette technique (scaffold `backend-api` FastAPI + `frontend-app` Next.js + entités partagées `core/` + stockage SQLite/FTS5) et prouve la chaîne complète ingestion → normalisation → stockage → recherche.
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-13

### Epic 2 : Découverte enrichie et API publique
Le chercheur affine ses résultats (filtres) et explore la disponibilité par langue (pages par langue) ; le développeur consomme l'Index par programme via l'API publique en lecture seule.
**FRs covered:** FR-12, FR-14, FR-15

### Epic 3 : Comptes et contributions
Un chercheur crée un Compte, soumet ses propres datasets à l'Index (avec Provenance rattachée à son Compte) et gère uniquement les siens ; les sources sans API sont référencées manuellement via l'interface.
**FRs covered:** FR-5, FR-16, FR-17, FR-18

### Epic 4 : Administration
Un Admin gère les références de tous les datasets (CRUD global, quelle qu'en soit l'origine) et gère les Comptes (création, désactivation, attribution des rôles).
**FRs covered:** FR-19, FR-20

## Epic 1 : Socle et index consultable

Un visiteur peut rechercher une langue africaine et obtenir des fiches de datasets normalisés, à partir d'un Index peuplé à la demande depuis Hugging Face et Kaggle. Cet epic pose le squelette technique et prouve la chaîne complète ingestion → normalisation → stockage → recherche.

**Plan de parallélisation (3 devs).** Une courte **phase socle** (Stories 1.1 → 1.3, idéalement en binôme) fixe le squelette, le modèle de données et **les contrats d'interface**. Une fois les contrats posés, le travail se répartit en **3 voies parallèles** — chacun développe contre une interface, pas contre le code fini des autres :
- **Voie Ingestion** (`ingestion/`) : connecteurs + normalisation + pipeline.
- **Voie Catalogue/API** (`catalog/`) : endpoints de recherche/lecture (peut avancer sur des données de test avant l'ingestion réelle).
- **Voie Frontend** (`frontend-app/`) : UI web (développe contre un *stub* de l'API défini par le contrat 1.3, avant que la recherche réelle soit prête).

Chaque story porte une ligne **Coordination** : *Voie · Dépend de · Parallélisable avec*.

### Phase socle (bloquante — à faire avant les voies parallèles)

### Story 1.1 : Initialiser le squelette du projet

As a développeur de l'équipe,
I want disposer d'un squelette de projet initialisé (`backend-api` FastAPI + `frontend-app` Next.js + `core/`),
So that l'équipe peut développer sur une base commune conforme au spine.

**Acceptance Criteria:**

**Given** un dépôt vide
**When** le squelette est initialisé
**Then** `backend-api/` contient les modules `core/`, `catalog/`, `ingestion/` (dossiers avec les couches routes/service/repository/models attendues) et un `main.py` qui démarre
**And** `core/` fournit `config.py`, `database.py` (connexion + session ORM SQLModel/SQLAlchemy) et `logging.py`
**And** `frontend-app/` est une application Next.js (16.2.x) qui démarre en local
**And** une route de santé (`/health`) répond 200

**Coordination :** Voie Socle · Dépend de : — · Bloquant pour tout le reste.

### Story 1.2 : Modèle du catalogue et persistance

As a développeur,
I want définir les entités partagées du catalogue dans `core/` et les persister,
So that les datasets et leurs métadonnées peuvent être stockés et relus durablement.

**Acceptance Criteria:**

**Given** le squelette de la Story 1.1
**When** le modèle de données est défini
**Then** `core/` définit une seule fois les entités partagées `Dataset`, `Language`, `Source`, `Task`, `License` (AD-12), avec leurs relations
**And** l'accès se fait via une couche `repository` utilisant l'ORM (AD-4), sans SQL dans `service.py`
**And** le stockage (SQLite + FTS5, provisoire) persiste les données et survit à un redémarrage (FR-9)
**And** le stockage ne contient aucun contenu de dataset, uniquement des métadonnées, la provenance et le lien

**Coordination :** Voie Socle · Dépend de : 1.1 · Bloquant pour les voies Ingestion et Catalogue.

### Story 1.3 : Contrats d'interface (connecteur + API catalog)

As a équipe de 3 devs,
I want figer le contrat de connecteur et le contrat de l'API `catalog` avant de nous répartir le travail,
So that chacun peut développer sa voie en parallèle contre une interface stable (avec stubs/mocks).

**Acceptance Criteria:**

**Given** le modèle de la Story 1.2
**When** les contrats sont définis
**Then** le **contrat de connecteur** est spécifié : signature commune + structure intermédiaire de métadonnées brutes produite par tout connecteur (AD-6)
**And** le **contrat de l'API `catalog`** est spécifié : formes des endpoints de recherche par langue et de fiche dataset (schémas de requête/réponse JSON)
**And** un *stub* de l'API `catalog` renvoie des données factices conformes au contrat, permettant à la voie Frontend de démarrer sans attendre l'implémentation réelle
**And** les contrats sont documentés et partagés avec l'équipe

**Coordination :** Voie Socle · Dépend de : 1.2 · **Débloque les 3 voies parallèles.**

### Voie Ingestion (`ingestion/`)

### Story 1.4 : Connecteur Hugging Face

As a membre de l'équipe,
I want un connecteur qui récupère les datasets de langues africaines depuis l'API Hugging Face,
So that leurs métadonnées brutes peuvent alimenter l'index.

**Acceptance Criteria:**

**Given** le contrat de connecteur (1.3) et l'API Hugging Face Hub accessible
**When** le connecteur Hugging Face s'exécute
**Then** il récupère les datasets et produit leurs métadonnées dans la structure intermédiaire commune (AD-6, FR-1)
**And** ajouter une autre source ne nécessitera qu'un nouveau connecteur, sans toucher au reste
**And** un échec du connecteur est journalisé de façon visible et n'interrompt pas le reste (AD-13)

**Coordination :** Voie Ingestion · Dépend de : 1.3 · Parallélisable avec : 1.5, 1.6, 1.7, 1.11, 1.12.

### Story 1.5 : Connecteur Kaggle

As a membre de l'équipe,
I want un connecteur Kaggle respectant le même contrat,
So that l'index couvre une deuxième source majeure sans modifier le reste.

**Acceptance Criteria:**

**Given** le contrat de connecteur (1.3)
**When** le connecteur Kaggle s'exécute
**Then** il ingère les datasets Kaggle dans la même structure intermédiaire (FR-1)
**And** son ajout n'a nécessité aucune modification des autres connecteurs ni de `catalog`

**Coordination :** Voie Ingestion · Dépend de : 1.3 · Parallélisable avec : 1.4, 1.6, 1.7, 1.11, 1.12 (peut être pris par un 2e dev en même temps que 1.4).

### Story 1.6 : Normalisation de l'identité de langue

As a chercheur,
I want que la langue de chaque dataset soit ramenée à un code canonique,
So that une recherche par langue ne rate aucun dataset à cause d'un nommage différent.

**Acceptance Criteria:**

**Given** la structure intermédiaire du contrat (1.3) — indépendamment du connecteur d'origine
**When** la normalisation de langue s'applique
**Then** la valeur brute est mappée vers un code canonique ISO 639-3 (Glottolog en repli) (FR-6)
**And** la valeur brute d'origine est conservée à côté du code canonique (traçabilité)
**And** une valeur non mappable est signalée pour revue plutôt que perdue silencieusement

**Coordination :** Voie Ingestion · Dépend de : 1.2, 1.3 · Parallélisable avec : 1.4, 1.5, 1.7, 1.11, 1.12 (opère sur la structure intermédiaire, pas sur un connecteur précis).

### Story 1.7 : Normalisation de la tâche et métadonnées manquantes

As a chercheur,
I want que la tâche NLP soit normalisée et que les métadonnées absentes soient explicites,
So that les filtres fonctionnent et aucun dataset n'est masqué faute de métadonnée.

**Acceptance Criteria:**

**Given** un dataset avec un tag de tâche brut et des champs éventuellement absents
**When** la normalisation s'applique
**Then** le tag de tâche est mappé vers une valeur du vocabulaire contrôlé (FR-7)
**And** toute métadonnée absente ou indéterminable est marquée « inconnu » et le dataset reste référencé (FR-8)

**Coordination :** Voie Ingestion · Dépend de : 1.2 · Parallélisable avec : 1.4, 1.5, 1.6, 1.11, 1.12.

### Story 1.8 : Écriture dans l'index et mise à jour atomique

As a membre de l'équipe,
I want que les datasets normalisés soient écrits dans l'index de façon atomique,
So that l'ajout de nouveaux datasets ne laisse jamais l'index dans un état incohérent.

**Acceptance Criteria:**

**Given** des datasets normalisés (issus de 1.6 et 1.7)
**When** l'ingestion écrit dans l'index
**Then** les nouveaux datasets deviennent consultables après l'ingestion (FR-4), avec origine `synchronisé`
**And** pendant l'écriture, une lecture renvoie toujours l'ancien état complet ou le nouvel état complet, jamais un état partiel/vide (FR-10)

**Coordination :** Voie Ingestion · Dépend de : 1.2, 1.6, 1.7 · Parallélisable avec : 1.11, 1.12.

### Story 1.9 : Retrait des datasets disparus

As a chercheur,
I want que les datasets qui n'existent plus à la source soient retirés,
So that l'index ne contient pas de références mortes.

**Acceptance Criteria:**

**Given** un dataset `synchronisé` présent dans l'index
**When** une ingestion s'exécute et ce dataset n'est plus renvoyé par sa source
**Then** le dataset est retiré de l'index et n'apparaît plus dans les résultats (FR-3)
**And** les datasets d'origine `contribué` ou `manuel` ne sont jamais retirés par ce mécanisme (AD-15)

**Coordination :** Voie Ingestion · Dépend de : 1.8 · Parallélisable avec : 1.11, 1.12.

### Story 1.10 : Déclencher une ingestion à la demande

As a membre de l'équipe,
I want déclencher une ingestion complète à la demande,
So that je peux mettre l'index à jour sans planificateur (le cron est en phase 2).

**Acceptance Criteria:**

**Given** un ou plusieurs connecteurs configurés
**When** je déclenche une ingestion à la demande (commande / point d'entrée)
**Then** l'ingestion s'exécute sans processus toujours allumé ni minuterie interne (FR-2, AD-5)
**And** chaque exécution produit une trace consultable : date, source, nombre d'ajouts/retraits, erreurs (AD-13)
**And** l'échec d'un connecteur n'empêche pas les autres de s'exécuter

**Coordination :** Voie Ingestion · Dépend de : 1.4/1.5, 1.8, 1.9 (orchestration de la voie) · Parallélisable avec : 1.11, 1.12.

### Voie Catalogue / API (`catalog/`)

### Story 1.11 : Recherche par langue (API catalog)

As a chercheur,
I want rechercher les datasets d'une langue,
So that j'obtiens en une requête tous les datasets pertinents pour cette langue.

**Acceptance Criteria:**

**Given** le modèle (1.2), le contrat d'API (1.3) et un jeu de données de test (seed) en attendant l'ingestion réelle
**When** je recherche une langue via l'API de `catalog`
**Then** la recherche s'appuie sur le code canonique, de sorte que « Yoruba », « Yorùbá » et « yor » retournent le même ensemble (FR-11)
**And** l'accès en lecture passe par l'API de `catalog`, jamais directement par la base (AD-3)

**Coordination :** Voie Catalogue/API · Dépend de : 1.2, 1.3 · Parallélisable avec : toute la voie Ingestion et 1.12 (utilise des données de seed avant que l'ingestion réelle soit prête).

### Voie Frontend (`frontend-app/`)

### Story 1.12 : Fiche dataset et redirection (interface web)

As a chercheur,
I want voir chaque résultat sous forme de fiche et être redirigé vers la source,
So that je peux évaluer un dataset et y accéder en un clic.

**Acceptance Criteria:**

**Given** le contrat d'API (1.3) et son *stub* — puis l'API réelle une fois 1.11 prête
**When** l'interface web affiche un résultat de recherche
**Then** chaque dataset s'affiche en fiche avec ses métadonnées normalisées (langue, tâche, taille/licence si connues, « inconnu » sinon) (FR-13)
**And** un clic redirige l'utilisateur vers le dataset sur sa source d'origine
**And** l'interface consomme l'API de `catalog` sans accéder à la base directement (AD-3)

**Coordination :** Voie Frontend · Dépend de : 1.3 (contrat + stub) · Parallélisable avec : toute la voie Ingestion et 1.11 (développe contre le stub, bascule sur l'API réelle quand 1.11 est livrée).

## Epic 2 : Découverte enrichie et API publique

Le chercheur affine ses résultats (filtres) et explore la disponibilité par langue (pages par langue) ; le développeur consomme l'Index par programme via l'API publique en lecture seule. S'appuie sur l'Index et l'API `catalog` de l'Epic 1.

**Plan de parallélisation (3 devs).** Deux voies parallèles : **Catalogue/API** (`catalog/` — endpoints de filtrage, agrégation par langue, API publique documentée) et **Frontend** (`frontend-app/` — UI de filtres, pages par langue) qui développe contre les contrats d'endpoints (stubs). Chaque endpoint backend définit sa forme en premier (première AC) pour débloquer le frontend.

### Voie Catalogue / API (`catalog/`)

### Story 2.1 : Endpoint de filtrage

As a chercheur,
I want filtrer les résultats par source, tâche NLP et type/format de données,
So that je ne garde que les datasets pertinents pour mon projet.

**Acceptance Criteria:**

**Given** l'API `catalog` de l'Epic 1
**When** le contrat de l'endpoint de filtrage est défini puis implémenté
**Then** la forme de requête/réponse du filtrage est documentée en premier (pour débloquer le frontend)
**And** combiner « Langue = Swahili » et « Tâche NLP = ASR » ne retourne que les datasets satisfaisant les deux (FR-12)
**And** les filtres opèrent sur les valeurs normalisées (code de langue, vocabulaire de tâches), pas sur les valeurs brutes

**Coordination :** Voie Catalogue/API · Dépend de : 1.11 · Parallélisable avec : 2.2, 2.3, et la voie Frontend (2.4, 2.5).

### Story 2.2 : Endpoint d'agrégation par langue

As a linguiste,
I want obtenir, pour une langue, la liste de ses datasets et des compteurs,
So that j'ai un état des lieux de sa disponibilité.

**Acceptance Criteria:**

**Given** un index peuplé
**When** l'endpoint d'agrégation par langue est appelé
**Then** il renvoie, pour une langue donnée, ses datasets et un compteur basique (nombre de datasets, tâches NLP couvertes) (FR-14)
**And** la forme de la réponse est documentée en premier (pour débloquer le frontend)

**Coordination :** Voie Catalogue/API · Dépend de : 1.2, 1.11 · Parallélisable avec : 2.1, 2.3, et la voie Frontend.

### Story 2.3 : API publique documentée en lecture seule

As a développeur externe,
I want interroger l'Index par programme via une API publique stable,
So that j'intègre la recherche de datasets dans mon propre pipeline.

**Acceptance Criteria:**

**Given** les endpoints de recherche et de filtrage (1.11, 2.1)
**When** l'API publique est exposée et documentée
**Then** elle renvoie les métadonnées normalisées au format JSON, avec au minimum le filtrage par langue et par tâche NLP (FR-15)
**And** chaque dataset renvoyé inclut son lien de redirection
**And** une même requête renvoie le même ensemble que l'interface web pour des critères identiques
**And** l'API est en lecture seule : aucune écriture n'y est exposée (AD-10)

**Coordination :** Voie Catalogue/API · Dépend de : 1.11, 2.1 · Parallélisable avec : la voie Frontend.

### Voie Frontend (`frontend-app/`)

### Story 2.4 : Interface de filtres

As a chercheur,
I want des contrôles de filtres dans l'interface web,
So that j'affine visuellement mes résultats de recherche.

**Acceptance Criteria:**

**Given** le contrat de l'endpoint de filtrage (2.1) et son stub
**When** j'utilise les filtres dans l'interface
**Then** je peux filtrer par source, tâche NLP et type/format, seuls ou combinés (FR-12)
**And** les résultats affichés reflètent les filtres actifs
**And** l'interface consomme l'API `catalog` sans accéder à la base directement (AD-3)

**Coordination :** Voie Frontend · Dépend de : 2.1 (contrat/stub) · Parallélisable avec : toute la voie Catalogue/API.

### Story 2.5 : Page par langue

As a linguiste,
I want une page dédiée par langue,
So that je vois d'un coup d'œil la disponibilité des ressources pour cette langue.

**Acceptance Criteria:**

**Given** le contrat de l'endpoint d'agrégation (2.2) et son stub
**When** j'ouvre la page d'une langue
**Then** la page affiche la liste des datasets de la langue et le compteur (nombre, tâches couvertes) (FR-14)
**And** chaque dataset y est cliquable et redirige vers sa source
**And** l'interface consomme l'API `catalog` sans accéder à la base directement (AD-3)

**Coordination :** Voie Frontend · Dépend de : 2.2 (contrat/stub) · Parallélisable avec : toute la voie Catalogue/API et 2.4.

## Epic 3 : Comptes et contributions

Un chercheur crée un Compte, soumet ses propres datasets à l'Index (avec Provenance rattachée à son Compte) et gère uniquement les siens ; les sources sans API sont référencées manuellement via l'interface. Introduit le module `accounts/`.

**Plan de parallélisation (3 devs).** Une story socle (**3.1**) pose l'entité `Account`, l'authentification et **le contrat de l'API `accounts`** (auth + contribution + gestion), avec stub. Ensuite deux voies parallèles : **Backend accounts** (`accounts/` — contribution, permissions) et **Frontend** (`frontend-app/` — auth, soumission, « mes datasets ») contre les contrats. Rappel des invariants : écritures derrière authentification (AD-10), contrôle d'accès par rôle et propriété **côté serveur** (AD-14), provenance (AD-15). Solution d'auth gratuite provisoire (Auth.js/NextAuth ou auth Supabase — question ouverte à trancher).

### Voie Backend accounts (`accounts/`)

### Story 3.1 : Comptes et authentification

As a chercheur,
I want créer un compte et m'authentifier,
So that je peux contribuer des datasets sous mon identité.

**Acceptance Criteria:**

**Given** le socle de l'Epic 1
**When** le module `accounts` et l'authentification sont mis en place
**Then** l'entité `Account` (identité minimale, rôle) est définie dans `core/` (AD-12) et un utilisateur peut créer un compte et se connecter (FR-16)
**And** deux rôles existent : `Chercheur` et `Admin`
**And** la consultation (recherche web + API `catalog`) reste possible **sans** compte (AD-10)
**And** le contrat de l'API `accounts` (auth, contribution, gestion) est documenté avec un stub, pour débloquer le frontend
**And** la solution d'auth retenue reste gratuite (provisoire : Auth.js/NextAuth ou auth Supabase)

**Coordination :** Voie Socle de l'epic · Dépend de : Epic 1 · **Débloque les voies Backend accounts et Frontend de cet epic.**

### Story 3.2 : Contribution d'un dataset par un chercheur

As a chercheur authentifié,
I want soumettre un dataset (y compris depuis une source sans API) à l'Index,
So that mon travail devient visible pour la communauté.

**Acceptance Criteria:**

**Given** un chercheur authentifié (3.1)
**When** il soumet un dataset (métadonnées + lien)
**Then** le dataset entre dans l'Index après normalisation, avec Provenance = son Compte et origine `contribué` (FR-17, AD-15)
**And** une source sans API peut être référencée par ce même mécanisme, avec origine `manuel` (FR-5)
**And** une entrée `contribué`/`manuel` n'est jamais retirée par l'ingestion automatique (AD-15)

**Coordination :** Voie Backend accounts · Dépend de : 3.1, normalisation (1.6, 1.7) · Parallélisable avec : 3.3 (partiellement) et toute la voie Frontend.

### Story 3.3 : Un chercheur ne gère que ses propres datasets

As a chercheur authentifié,
I want voir, modifier et supprimer uniquement mes propres soumissions,
So that je garde le contrôle de mes contributions sans toucher à celles des autres.

**Acceptance Criteria:**

**Given** des datasets contribués par différents comptes
**When** un chercheur accède à la gestion de ses datasets
**Then** il ne voit en gestion, ne modifie et ne supprime que les datasets dont il est la Provenance (FR-18)
**And** toute tentative d'agir sur le dataset d'un autre compte est refusée **côté serveur** (`accounts.service`), pas seulement masquée dans l'UI (AD-14)

**Coordination :** Voie Backend accounts · Dépend de : 3.1, 3.2 · Parallélisable avec : la voie Frontend.

### Voie Frontend (`frontend-app/`)

### Story 3.4 : Interface d'authentification

As a chercheur,
I want des écrans de création de compte et de connexion,
So that je peux m'authentifier pour contribuer.

**Acceptance Criteria:**

**Given** le contrat de l'API `accounts` (3.1) et son stub
**When** j'utilise l'interface d'authentification
**Then** je peux créer un compte et me connecter/déconnecter (FR-16)
**And** les zones de contribution ne sont accessibles qu'une fois authentifié
**And** la consultation reste accessible sans être connecté

**Coordination :** Voie Frontend · Dépend de : 3.1 (contrat/stub) · Parallélisable avec : la voie Backend accounts.

### Story 3.5 : Interface de soumission d'un dataset

As a chercheur authentifié,
I want un formulaire de soumission de dataset,
So that je référence mon dataset facilement.

**Acceptance Criteria:**

**Given** un chercheur authentifié et le contrat de contribution (3.2)
**When** il remplit et valide le formulaire (langue, tâche, lien, licence…)
**Then** le dataset est soumis et apparaît ensuite dans l'Index avec sa provenance (FR-17)
**And** le formulaire permet aussi de référencer une source sans API (FR-5)

**Coordination :** Voie Frontend · Dépend de : 3.2 (contrat/stub) · Parallélisable avec : la voie Backend accounts et 3.4.

### Story 3.6 : Interface « mes datasets »

As a chercheur authentifié,
I want un espace listant mes soumissions,
So that je peux les mettre à jour ou les retirer.

**Acceptance Criteria:**

**Given** un chercheur ayant contribué des datasets et le contrat de gestion (3.3)
**When** il ouvre son espace « mes datasets »
**Then** il ne voit que ses propres soumissions et peut les modifier ou les supprimer (FR-18)
**And** aucune soumission d'un autre chercheur n'y apparaît

**Coordination :** Voie Frontend · Dépend de : 3.3 (contrat/stub) · Parallélisable avec : la voie Backend accounts et 3.4, 3.5.

## Epic 4 : Administration

Un Admin gère les références de tous les datasets (CRUD global, quelle qu'en soit l'origine) et gère les Comptes (création, désactivation, attribution des rôles). S'appuie sur l'authentification et les rôles de l'Epic 3.

**Plan de parallélisation (3 devs).** Deux voies parallèles : **Backend accounts** (`accounts/` — endpoints d'administration des datasets et des comptes, réservés au rôle Admin) et **Frontend** (`frontend-app/` — interface d'administration) contre les contrats/stubs. Les capacités admin étendent l'API `accounts` définie en 3.1. Contrôle du rôle Admin **côté serveur** (AD-14).

### Voie Backend accounts (`accounts/`)

### Story 4.1 : Administration des datasets (CRUD global)

As a admin,
I want ajouter, consulter, modifier et supprimer les références de tous les datasets,
So that je peux corriger et nettoyer l'Index quelle que soit l'origine des entrées.

**Acceptance Criteria:**

**Given** un utilisateur ayant le rôle Admin (Epic 3)
**When** il agit sur un dataset via les endpoints d'administration
**Then** il peut ajouter, consulter, modifier et supprimer n'importe quel dataset, quelle qu'en soit l'origine (`synchronisé`, `contribué`, `manuel`) (FR-19)
**And** il voit l'ensemble des datasets de l'Index
**And** ces opérations sont refusées **côté serveur** à tout utilisateur non-Admin (AD-14)
**And** le contrat de ces endpoints est documenté avec un stub pour débloquer le frontend

**Coordination :** Voie Backend accounts · Dépend de : 3.1 (rôles) · Parallélisable avec : 4.2 et la voie Frontend.

### Story 4.2 : Gestion des comptes

As a admin,
I want gérer les comptes des utilisateurs,
So that je contrôle qui peut contribuer et avec quel rôle.

**Acceptance Criteria:**

**Given** un utilisateur ayant le rôle Admin
**When** il gère les comptes
**Then** il peut créer, désactiver un compte et attribuer les rôles (Chercheur/Admin) (FR-20)
**And** un utilisateur non-Admin ne peut pas accéder à la gestion des comptes (refus **côté serveur**, AD-14)
**And** un compte désactivé ne peut plus s'authentifier ni contribuer
**And** le contrat de ces endpoints est documenté avec un stub pour débloquer le frontend

**Coordination :** Voie Backend accounts · Dépend de : 3.1 (entité `Account`, rôles) · Parallélisable avec : 4.1 et la voie Frontend.

### Voie Frontend (`frontend-app/`)

### Story 4.3 : Interface d'administration des datasets

As a admin,
I want une interface pour gérer tous les datasets,
So that je corrige et nettoie l'Index visuellement.

**Acceptance Criteria:**

**Given** un admin authentifié et le contrat d'administration des datasets (4.1)
**When** il ouvre l'interface d'administration des datasets
**Then** il voit tous les datasets et peut en ajouter, modifier ou supprimer, quelle qu'en soit l'origine (FR-19)
**And** l'interface d'administration n'est pas accessible à un utilisateur non-Admin

**Coordination :** Voie Frontend · Dépend de : 4.1 (contrat/stub) · Parallélisable avec : la voie Backend accounts et 4.4.

### Story 4.4 : Interface de gestion des comptes

As a admin,
I want une interface pour gérer les comptes,
So that je crée, désactive des comptes et attribue les rôles.

**Acceptance Criteria:**

**Given** un admin authentifié et le contrat de gestion des comptes (4.2)
**When** il ouvre l'interface de gestion des comptes
**Then** il peut créer, désactiver un compte et attribuer les rôles (FR-20)
**And** l'interface n'est pas accessible à un utilisateur non-Admin

**Coordination :** Voie Frontend · Dépend de : 4.2 (contrat/stub) · Parallélisable avec : la voie Backend accounts et 4.3.
