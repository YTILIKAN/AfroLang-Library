---
title: AfroLang-Library
status: final
created: 2026-07-01
updated: 2026-07-04
---

# PRD : AfroLang-Library
*Titre de travail — à confirmer.*

## 0. Objet du document

Ce PRD s'adresse à l'équipe produit de Y'TILiKAN (3 personnes) et aux étapes aval de la méthode (UX, architecture, découpage en epics/stories). Il transforme le [product brief finalisé](../../briefs/brief-AfroLang-Library-2026-07-01/brief.md) en exigences précises. Il est structuré ainsi : vocabulaire ancré par un glossaire (§3), fonctionnalités regroupées avec exigences fonctionnelles (FR) numérotées globalement (§4), exigences non-fonctionnelles transverses (§10), hypothèses marquées `[HYPOTHÈSE]` en ligne et regroupées en §9. Les choix techniques (pile, mécanismes, technologie de stockage, solution d'authentification) ne figurent pas ici : ils vivent dans l'`addendum.md` de ce dossier et dans celui du brief, socles de l'étape architecture.

> **Note de révision (2026-07-01).** Cette version intègre un changement de cap de l'équipe : ajout de **comptes + rôles + contributions** (un chercheur se connecte pour soumettre ses datasets, avec traçabilité) et d'une **interface d'administration** ; la **synchronisation automatique planifiée (cron)** passe en **phase 2** (au MVP, l'ingestion est déclenchée à la demande) ; le **déploiement public est différé** (les premières versions tournent en local). Ces points renversent des décisions du brief (« pas de comptes, pas de contributions, index auto ») — assumés ici.

## 1. Vision

AfroLang-Library est un index unifié des datasets de langues africaines. Plus de 2 000 langues existent sur le continent, mais les données pour l'IA (NLP, ASR) sont éparpillées entre Hugging Face, Kaggle, Zindi, OpenSLR, OPUS et d'autres — mal nommées, mal documentées, difficiles à retrouver. Le produit référence les *métadonnées* de ces datasets dans un répertoire recherchable et filtrable, puis redirige vers la source. Il n'héberge aucune donnée.

Sa valeur centrale est un schéma unifié qui réconcilie les nommages incohérents des plateformes — en particulier l'identité de langue, ancrée sur des standards (ISO 639-3, complété par Glottolog) — pour qu'une recherche par langue ne rate jamais un dataset pertinent. L'Index se peuple de trois façons : l'**ingestion** depuis les Sources à API (déclenchée à la demande au MVP, automatisée en phase 2), la **contribution** par des chercheurs authentifiés qui soumettent leurs propres datasets (avec traçabilité de la provenance), et le **référencement manuel** par l'équipe.

Le produit est consultable de deux façons, sans compte : une interface web de recherche/filtrage, et une API publique interrogeable par programme. À terme, il vise à devenir la référence mondiale pour l'IA des langues africaines et le socle d'un cadre de benchmarking. Ce PRD cadre le MVP, construit par une équipe de 3 personnes sans budget, tournant d'abord en local avant un déploiement ultérieur.

## 2. Utilisateur cible

### 2.1 Jobs To Be Done

- **Fonctionnel (consultation)** : « Étant donné une langue africaine, trouver rapidement tous les datasets disponibles et comment y accéder, sans fouiller plusieurs plateformes. »
- **Fonctionnel** : « Filtrer les datasets par tâche NLP (ASR, traduction, NER…) et par source pour ne garder que ceux qui servent mon projet. »
- **Fonctionnel (développeur)** : « Interroger le répertoire par programme (API) pour intégrer la recherche de datasets dans mon propre pipeline. »
- **Fonctionnel (contribution)** : « Rendre mon propre dataset visible dans l'index, en le soumettant depuis mon compte, et pouvoir le mettre à jour ou le retirer. »
- **Social / mission** : « Contribuer à rendre les langues africaines visibles dans l'IA moderne. »

### 2.2 Non-utilisateurs (v1)

- Le grand public non technique cherchant à *utiliser* une langue (traduction, apprentissage) — le produit référence des datasets, pas des outils grand public.
- Ceux qui voudraient qu'AfroLang-Library **héberge** leurs données — le produit ne stocke que des Métadonnées et un lien ; un chercheur peut soumettre une *référence* à son dataset, jamais le dataset lui-même.
- Les utilisateurs externes au **déploiement** : tant que le MVP tourne en local, seule l'équipe l'utilise ; la contribution ouverte aux chercheurs externes devient effective à la mise en ligne.

### 2.3 Parcours utilisateurs clés

- **UJ-1. Aïcha cherche des données pour le Wolof depuis le web.**
  Aïcha, chercheuse en NLP dans une université ouest-africaine, démarre un projet de reconnaissance vocale en wolof. Non authentifiée (aucun compte requis pour consulter), elle arrive sur AfroLang-Library, tape « Wolof » dans la recherche. Le système reconnaît la langue via son code canonique et retourne tous les datasets rattachés — quelle que soit la façon dont chaque plateforme l'avait nommée (« Wolof », « wol », « wo »). Elle filtre par tâche « ASR ». Chaque résultat affiche une fiche (langue, tâche, taille si connue, licence si connue, source). Elle clique et est redirigée vers la page Hugging Face du dataset. **Climax :** en une recherche, elle a la liste complète et fiable. **Edge case :** un champ manquant (licence inconnue) s'affiche « inconnu » plutôt que de masquer le dataset.

- **UJ-2. Kwame interroge l'API depuis son pipeline.**
  Kwame, développeur, construit un pipeline d'entraînement multilingue. Il appelle l'API publique d'AfroLang-Library pour récupérer, au format structuré (JSON), tous les datasets de tâche « traduction » pour un ensemble de langues. Il intègre l'appel dans son script. **Climax :** il n'a écrit aucun scraper maison ; une requête suffit.

- **UJ-3. Fatou explore la disponibilité pour le Ghomala.**
  Fatou, linguiste, ouvre la page dédiée à la langue et voit d'un coup d'œil le nombre de datasets référencés et les tâches couvertes. **Resolution :** elle repart avec un état des lieux clair, même si la réponse est « peu de ressources ».

- **UJ-4. Kofi rend son dataset indexable.**
  Kofi, chercheur, a publié un corpus en twi sur Hugging Face et veut qu'il soit trouvable dans AfroLang-Library. Il **crée un compte et se connecte**, remplit le formulaire de soumission (langue, tâche, lien, licence…), et valide. Le dataset entre dans l'Index avec sa **provenance** enregistrée (le compte de Kofi). Plus tard, il revient, **voit uniquement ses propres soumissions**, corrige une métadonnée et en retire une devenue obsolète. **Climax :** son travail devient visible pour toute la communauté sans passer par l'équipe. **Edge case :** il ne peut ni voir en gestion ni modifier les datasets soumis par d'autres.

- **UJ-5. Une admin nettoie l'index.**
  Une administratrice de l'équipe se connecte à l'interface d'administration, repère une référence erronée soumise par un utilisateur, la corrige (ou la supprime), et désactive un compte abusif. Elle voit **tous** les datasets, quelle qu'en soit l'origine.

## 3. Glossaire

*Les workflows aval et le document lui-même utilisent ces termes exactement, sans synonyme.*

- **Dataset** — Un jeu de données de langue(s) africaine(s) publié sur une Source externe. AfroLang-Library en référence les Métadonnées, jamais le contenu.
- **Source** — Une plateforme externe hébergeant des Datasets (Hugging Face, Kaggle, Zindi, OpenSLR, OPUS…). Une Source à API est intégrée via un Connecteur.
- **Connecteur** — Le composant qui, pour une Source donnée, récupère et met à jour ses Datasets via l'API de la Source. Un Connecteur par Source.
- **Métadonnée** — Une propriété décrivant un Dataset : Langue, Tâche NLP, type/format de données, taille, licence, date de publication, lien d'accès, Provenance. Jamais le contenu du Dataset.
- **Provenance (Origine)** — La façon dont un Dataset est entré dans l'Index : `synchronisé` (via un Connecteur), `contribué` (soumis par un Chercheur, rattaché à son Compte), ou `manuel` (référencé par l'équipe).
- **Langue** — Une langue identifiée par son **code canonique** ISO 639-3 (Glottolog en repli si l'ISO ne couvre pas). Toute valeur brute d'une Source est mappée vers ce code canonique.
- **Tâche NLP** — Le type d'usage d'un Dataset, exprimé dans un **vocabulaire contrôlé** fixe (ex. ASR, Traduction, NER, Classification, TTS, Résumé).
- **Index** — L'ensemble unifié et normalisé des Métadonnées de tous les Datasets référencés, **persisté** dans un stockage durable. C'est ce qu'exposent l'interface web et l'API.
- **Ingestion** — Le processus qui récupère les Datasets des Sources à API via leurs Connecteurs, les normalise et les écrit dans l'Index. Déclenchée **à la demande** au MVP ; **automatisée et planifiée** (Synchronisation) en phase 2.
- **Synchronisation (planifiée)** — L'automatisation périodique de l'Ingestion (ajout des nouveaux Datasets, retrait des disparus), sans intervention humaine. **Phase 2.**
- **Compte** — L'identité authentifiée d'un Utilisateur. Requis pour contribuer ou administrer ; non requis pour consulter.
- **Utilisateur** — Toute personne interagissant avec le produit. Porte un **Rôle** : Chercheur ou Admin.
- **Chercheur (Contributeur)** — Un Utilisateur authentifié qui soumet des Datasets et gère **uniquement les siens** (voir, modifier, supprimer).
- **Admin** — Un Utilisateur authentifié qui gère les références de Datasets de **tout le monde** (ajouter, modifier, supprimer, consulter) et gère les Comptes.
- **Fiche dataset** — La présentation, dans l'interface web, des Métadonnées normalisées d'un Dataset, avec le lien de Redirection.
- **Redirection** — Le renvoi de l'utilisateur vers le Dataset sur sa Source d'origine.
- **Inconnu** — Valeur affichée pour une Métadonnée absente ou non déterminable ; n'empêche jamais le référencement du Dataset.

## 4. Fonctionnalités

### 4.1 Ingestion depuis les sources à API

**Description :** Le système alimente l'Index en interrogeant chaque Source via son Connecteur. L'ancrage MVP est Hugging Face et Kaggle ; toute Source disposant d'une API gratuite exploitable peut être ajoutée via un nouveau Connecteur. Au MVP, l'Ingestion est **déclenchée à la demande** ; son automatisation planifiée (Synchronisation) est en phase 2. Réalise UJ-1, UJ-2, UJ-3.

**Functional Requirements :**

#### FR-1 : Connecteur de source
Le système peut ingérer les Datasets d'une Source via son API et en extraire les Métadonnées brutes. L'ajout d'une nouvelle Source se fait par l'ajout d'un Connecteur, sans refonte du reste du système.
**Consequences (testables) :**
- Un Connecteur Hugging Face et un Connecteur Kaggle existent et peuplent l'Index.
- Ajouter une Source supplémentaire (ex. Zindi) ne requiert que l'écriture d'un nouveau Connecteur respectant un contrat commun.
**Out of Scope :** Sources sans API (traitées par scraping en phase 2 — voir §6.2).

#### FR-2 : Déclenchement de l'ingestion
Au MVP, l'Ingestion est déclenchée **à la demande** (par l'équipe / un Admin), sans planificateur. La **Synchronisation automatique planifiée** (cron) est reportée en **phase 2**.
**Consequences (testables) :**
- Un membre de l'équipe peut lancer une Ingestion à la demande et l'Index reflète ensuite l'état courant des Sources.
- Chaque exécution produit une trace consultable (date, Source, nombre d'ajouts/retraits, erreurs) — voir NFR observabilité §10.
**Notes :** `[NOTE FOR PM]` L'automatisation planifiée (cron) et la fraîcheur « sans intervention humaine » deviennent un objectif de phase 2.

#### FR-3 : Retrait des datasets disparus
Lors d'une Ingestion, quand un Dataset `synchronisé` n'est plus renvoyé par sa Source, le système le retire de l'Index.
**Consequences (testables) :**
- Un Dataset `synchronisé` absent de la réponse de la Source lors d'une Ingestion n'apparaît plus dans les résultats à l'issue de celle-ci.
- Les Datasets `contribué` et `manuel` ne sont pas affectés par ce retrait automatique.

#### FR-4 : Ajout des nouveaux datasets
Lors d'une Ingestion, quand un nouveau Dataset apparaît sur une Source, le système l'ajoute à l'Index après Normalisation (§4.2).
**Consequences (testables) :**
- Un Dataset publié sur une Source intégrée devient consultable (web + API) après l'Ingestion suivante.

#### FR-5 : Référencement manuel des sources sans API
Les Sources ne disposant pas d'API sont référencées manuellement via l'interface (contribution d'un Chercheur — FR-17 — ou saisie Admin — FR-19), avec Provenance `manuel`.
**Consequences (testables) :**
- Une entrée `manuel` est référençable et distinguable d'une entrée `synchronisé` ; elle n'est pas soumise au retrait automatique (FR-3).
**Notes :** `[NOTE FOR PM]` Une entrée manuelle peut devenir obsolète (Dataset disparu non détecté) jusqu'à la phase 2/scraping. Compromis assumé au brief.

### 4.2 Normalisation vers un schéma unifié

**Description :** Chaque Dataset entrant — quelle que soit sa Provenance — est ramené au schéma commun avant d'entrer dans l'Index. C'est le cœur de valeur : sans normalisation, la recherche par langue échoue. Réalise UJ-1, UJ-3, UJ-4.

**Functional Requirements :**

#### FR-6 : Normalisation de l'identité de langue
Le système mappe la valeur de langue brute vers le code canonique de la **Langue** (ISO 639-3 ; Glottolog en repli).
**Consequences (testables) :**
- Deux Datasets décrits « Wolof » et « wol » sont rattachés au même code canonique et remontent ensemble à une recherche « Wolof ».
- Une valeur de langue non mappable est signalée pour revue plutôt que silencieusement perdue.

#### FR-7 : Normalisation de la tâche NLP
Le système mappe le tag de tâche brut vers une valeur du vocabulaire contrôlé **Tâche NLP**.
**Consequences (testables) :**
- Les filtres par Tâche NLP opèrent sur le vocabulaire contrôlé, pas sur les tags bruts.

#### FR-8 : Gestion des métadonnées manquantes
Quand une Métadonnée est absente ou non déterminable, le système la marque **Inconnu** et référence quand même le Dataset.
**Consequences (testables) :**
- Un Dataset sans licence indiquée apparaît dans les résultats, licence affichée « inconnu ».

### 4.3 Stockage et persistance de l'Index

**Description :** L'Index — l'ensemble des Métadonnées normalisées — est persisté dans un stockage durable, **source unique** lue par l'interface web (§4.4) et l'API (§4.6). Le stockage ne contient que des Métadonnées (et les Comptes — §4.7), jamais le contenu des Datasets. La technologie de stockage n'est pas fixée ici (voir addendum) mais est contrainte par le coût nul (§10).

**Functional Requirements :**

#### FR-9 : Persistance de l'Index
Le système persiste les Métadonnées normalisées dans un stockage durable ; l'Index survit aux redémarrages et reste servi même quand aucune Ingestion n'est en cours.
**Consequences (testables) :**
- Après un redémarrage sans nouvelle Ingestion, une recherche retourne les mêmes Datasets qu'avant.
- Le web et l'API lisent les mêmes données persistées.
- Le stockage ne contient aucun contenu de Dataset, uniquement des Métadonnées, la Provenance et le lien de Redirection.

#### FR-10 : Mise à jour atomique par l'ingestion
Une Ingestion met à jour l'Index sans laisser les lecteurs (web/API) sur un état incohérent. `[HYPOTHÈSE : stratégie de mise à jour à préciser à l'architecture.]`
**Consequences (testables) :**
- Pendant une Ingestion, une recherche continue de renvoyer un Index cohérent (ancien ou nouvel état complet, jamais un état partiel).

**Notes :** `[NOTE FOR PM]` Le **modèle de données** découle du Glossaire (§3) : Dataset (identifiant, Source, code de Langue, Tâche(s), taille, licence, date, lien, **Provenance**, Compte contributeur le cas échéant) et Compte (identité, rôle). Sa forme concrète est un livrable de l'architecture.

### 4.4 Recherche et filtrage (interface web)

**Description :** L'interface web permet à un visiteur **non authentifié** de trouver des Datasets par Langue et de les affiner. Réalise UJ-1.

**Functional Requirements :**

#### FR-11 : Recherche par langue
Un visiteur peut rechercher les Datasets d'une Langue. La recherche s'appuie sur le code canonique, de sorte que les variantes de nommage retournent le même ensemble.
**Consequences (testables) :**
- Rechercher « Yoruba », « Yorùbá » ou « yor » retourne le même ensemble de Datasets.

#### FR-12 : Filtres
Un visiteur peut filtrer les résultats par Source, Tâche NLP et type/format de données.
**Consequences (testables) :**
- Combiner « Langue = Swahili » et « Tâche NLP = ASR » ne retourne que les Datasets satisfaisant les deux.

#### FR-13 : Fiche dataset et redirection
Chaque résultat s'affiche en **Fiche dataset** (Métadonnées normalisées + lien) et permet la **Redirection** vers la Source.
**Consequences (testables) :**
- Cliquer sur une Fiche dataset ouvre le Dataset sur sa Source d'origine.

### 4.5 Pages par langue

**Description :** Une page dédiée par Langue offre un état des lieux de sa disponibilité. Version simple au MVP. Réalise UJ-3.

**Functional Requirements :**

#### FR-14 : Page dédiée par langue
Le système fournit, pour chaque Langue présente dans l'Index, une page listant ses Datasets et un compteur basique (nombre de Datasets, Tâches NLP couvertes).
**Consequences (testables) :**
- La page d'une Langue affiche le décompte de ses Datasets et la liste des Tâches NLP disponibles.
**Out of Scope :** statistiques avancées (évolution temporelle, couverture par famille/région) — voir §6.2.

### 4.6 API publique

**Description :** Le produit expose son Index **en lecture seule** par programme, pour l'utilisateur développeur. Réalise UJ-2.

**Functional Requirements :**

#### FR-15 : Interrogation de l'index par API
Un client peut interroger l'Index via une API publique et récupérer les Métadonnées normalisées au format structuré (JSON), avec au minimum le filtrage par Langue et par Tâche NLP.
**Consequences (testables) :**
- Une requête API filtrant par Langue et Tâche NLP renvoie le même ensemble que l'interface web pour les mêmes critères.
- Chaque Dataset renvoyé inclut le lien de Redirection vers sa Source.
- L'API publique n'expose aucune écriture (contributions et administration passent par la surface authentifiée, §4.7/§4.8).
**Feature-specific NFRs :** contrat d'API stable et documenté (voir §11).

### 4.7 Comptes, rôles et contributions

**Description :** Un Utilisateur peut créer un Compte pour **contribuer** des Datasets. La consultation (§4.4, §4.6) reste ouverte sans compte ; contribuer ou administrer exige une authentification. Chaque Dataset contribué porte sa **Provenance** (le Compte du Chercheur). Réalise UJ-4.

**Functional Requirements :**

#### FR-16 : Comptes et authentification
Un Utilisateur peut créer un Compte et s'authentifier. Deux Rôles existent : **Chercheur** et **Admin**.
**Consequences (testables) :**
- Consulter/rechercher (web + API) ne requiert aucun Compte.
- Contribuer, gérer ses Datasets ou administrer requiert une authentification.
- Le Rôle d'un Utilisateur détermine ses permissions (FR-18, FR-19, FR-20).
**Feature-specific NFRs :** voir Sécurité §10 ; solution d'authentification à trancher à l'architecture (§8, addendum).

#### FR-17 : Contribution d'un dataset par un chercheur
Un Chercheur authentifié peut soumettre un Dataset (Métadonnées + lien) à l'Index ; le système enregistre la **Provenance** = son Compte, et normalise l'entrée (§4.2).
**Consequences (testables) :**
- Un Dataset contribué apparaît dans l'Index avec Provenance `contribué` rattachée au Compte du Chercheur.
- Un Dataset contribué est distinguable d'un Dataset `synchronisé` et d'un Dataset `manuel`.

#### FR-18 : Un chercheur ne gère que ses propres contributions
Un Chercheur peut voir, modifier et supprimer **uniquement** les Datasets qu'il a soumis.
**Consequences (testables) :**
- Un Chercheur ne peut pas modifier ni supprimer un Dataset soumis par un autre Utilisateur ou issu de l'Ingestion.
- L'espace de gestion d'un Chercheur ne liste que ses propres soumissions.

### 4.8 Interface d'administration

**Description :** L'interface d'administration donne à un Admin la maîtrise complète des références et des Comptes. Réalise UJ-5.

**Functional Requirements :**

#### FR-19 : Administration des datasets (CRUD global)
Un Admin peut ajouter, consulter, modifier et supprimer les références de **tous** les Datasets, quelle qu'en soit la Provenance (synchronisé, contribué, manuel).
**Consequences (testables) :**
- Un Admin voit l'ensemble des Datasets de l'Index.
- Un Admin peut modifier ou supprimer un Dataset soumis par n'importe quel Chercheur.

#### FR-20 : Gestion des comptes
Un Admin peut gérer les Comptes : créer, désactiver, et attribuer les Rôles.
**Consequences (testables) :**
- Un Admin peut désactiver un Compte ; un Utilisateur non-Admin ne peut pas accéder à la gestion des Comptes.

## 5. Non-Goals (explicites)

- Le produit **n'héberge, ne stocke, ne sert aucune donnée** de Dataset ; il ne stocke que des Métadonnées, la Provenance et un lien, et redirige. Une contribution est une *référence*, pas un dépôt de données.
- Le produit **n'est pas** un outil grand public de traduction ou d'apprentissage de langues.
- Le produit **ne scrape pas** les Sources sans API en v1 (phase 2).
- Le produit **ne synchronise pas automatiquement** en v1 (l'Ingestion planifiée par cron est en phase 2).
- Le produit **n'est pas** encore une plateforme de benchmarking (phase future).

## 6. Périmètre MVP

### 6.1 Dans le périmètre

- Ingestion depuis les Sources à API, ancrée sur Hugging Face et Kaggle (extensible via Connecteur), **déclenchée à la demande**.
- Normalisation : Langue (ISO 639-3 + Glottolog), Tâche NLP (vocabulaire contrôlé), « inconnu » pour les champs manquants.
- Persistance de l'Index dans un stockage durable et gratuit (source unique pour web + API).
- Interface web publique : recherche par Langue, filtres, Fiche dataset, Redirection, Pages par Langue (version simple) — **sans compte**.
- API publique d'interrogation de l'Index (lecture seule).
- **Comptes + authentification + rôles** (Chercheur, Admin).
- **Contribution** de Datasets par un Chercheur avec Provenance, et gestion de ses propres soumissions.
- **Interface d'administration** : CRUD sur tous les Datasets + gestion des Comptes.
- Référencement manuel des Sources sans API via l'interface.
- Fonctionnement **en local** d'abord (déploiement différé).

### 6.2 Hors périmètre MVP

- **Synchronisation automatique planifiée (cron)** — *phase 2* (au MVP, l'Ingestion est manuelle/à la demande).
- **Déploiement public** (mise en ligne front + API + auth durcie) — *différé* jusqu'à maturité du MVP local.
- Scraping des Sources sans API — *phase 2*.
- Cadre de benchmarking et leaderboards — *phase future*.
- **Favoris (phase 2)** : un Utilisateur peut ajouter un Dataset à ses favoris. Au clic sur « Ajouter aux favoris », s'il n'est pas authentifié, le système l'invite à **se connecter ou créer un Compte** ; s'il est déjà authentifié, le Dataset est **ajouté à ses favoris**. S'appuie sur le modèle de Comptes bâti au MVP. Autres fonctionnalités sociales / notifications : plus tard. `[NOTE FOR PM]`
- Tableaux de bord statistiques riches (évolution temporelle, couverture par famille/région).
- Déduplication automatique d'un même Dataset présent sur plusieurs Sources. `[NOTE FOR PM : à évaluer en phase 2 ; en MVP les doublons inter-sources sont tolérés.]`
- Modération avancée / workflow de validation des contributions (au MVP, l'Admin corrige a posteriori). `[NOTE FOR PM]`
- Hébergement de données.

## 7. Métriques de succès

*Cibles chiffrées laissées ouvertes, à caler par l'équipe.*

**Primaires**
- **SM-1 — Fiabilité de la requête clé** : une recherche par Langue retourne l'ensemble complet des Datasets pertinents, sans manque dû au nommage. Valide FR-6, FR-11.
- **SM-2 — Couverture** : nombre de Langues et de Datasets référencés (toutes Provenances). Valide FR-1, FR-4, FR-17. `[Cible à définir.]`
- **SM-3 — Fraîcheur à la demande** : après une Ingestion, l'Index reflète l'état courant des Sources à API (ajouts/retraits effectifs). Valide FR-2, FR-3, FR-4. `[NOTE FOR PM : la fraîcheur automatique « sans intervention » est un objectif de phase 2.]`

**Secondaires**
- **SM-4 — API opérationnelle** : l'API publique répond de façon fiable et renvoie les mêmes résultats que l'interface web pour des critères identiques. Valide FR-15.
- **SM-5 — Adoption** : usage réel (visites web + appels API). `[Cible à définir.]`
- **SM-6 — Contributions** : nombre de Datasets contribués par des Chercheurs, avec Provenance correctement enregistrée. Valide FR-17. `[Cible à définir.]`

**Contre-métriques (à ne pas optimiser)**
- **SM-C1 — Sur-couverture au détriment de la qualité** : ne pas gonfler SM-2/SM-6 en référençant des Datasets mal normalisés ou hors périmètre (langues non africaines, entrées non vérifiées). Contrebalance SM-2, SM-6.
- **SM-C2 — Faux « à jour »** : ne pas masquer une Ingestion en échec (Connecteur cassé) pour préserver l'apparence de fraîcheur ; un échec doit être visible (voir §10). Contrebalance SM-3.

## 8. Questions ouvertes

1. Quelles Sources au-delà de Hugging Face et Kaggle disposent d'une API gratuite exploitable (Zindi, OPUS, OpenSLR, Masakhane…) ?
2. Fréquence de Synchronisation (phase 2) et contraintes de quotas/limites des API des Sources.
3. Liste définitive du vocabulaire contrôlé des Tâches NLP (FR-7).
4. Comment identifier de façon fiable qu'un Dataset concerne une **langue africaine** (filtrage) pour éviter le bruit (SM-C1) ?
5. Politique vis-à-vis des conditions d'utilisation / attribution des Sources.
6. Cibles chiffrées de succès (SM-2, SM-5, SM-6) et critère de « maturité » déclenchant le déploiement.
7. **Solution d'authentification gratuite** (ex. Auth.js/NextAuth, auth de Supabase, autre) — à trancher à l'architecture.
8. **Durcissement de la sécurité au déploiement** : protection de l'interface d'administration et de la surface d'écriture avant la mise en ligne publique.
9. **Contrôle qualité des contributions** : faut-il un minimum de vérification à la soumission (au-delà de la correction a posteriori par l'Admin) pour limiter le bruit ?

## 9. Index des hypothèses

- FR-2 — La Synchronisation automatique planifiée est repoussée en phase 2 ; le MVP déclenche l'Ingestion à la demande.
- FR-10 — Stratégie de mise à jour atomique de l'Index à préciser à l'architecture.
- §4.6 / §11 — Format d'API supposé JSON, style REST ; à confirmer à l'architecture.
- §11 — Politique de versionnement du contrat d'API à préciser à l'architecture.
- §10 — Cibles de performance à définir.
- §10 — Langue de l'interface (FR/EN) à confirmer.
- Ancrage Sources — suppose que les API Hugging Face et Kaggle exposent les Métadonnées nécessaires de façon exploitable.
- Périmètre comptes — suppose que le modèle comptes/rôles/contributions est bâti au MVP (local) et que l'usage par des Chercheurs externes devient effectif au déploiement.

## 10. Exigences non-fonctionnelles transverses

- **Coût (contrainte dure)** : toute la solution doit fonctionner à coût nul ou quasi nul — stockage, exécution de l'Ingestion, authentification et (à terme) hébergement compris. Voir addendum.
- **Sécurité** : authentification des Comptes ; **contrôle d'accès par Rôle** — un Chercheur n'agit que sur ses propres Datasets (FR-18), l'administration et la gestion des Comptes sont réservées à l'Admin (FR-19, FR-20). L'interface d'administration et toute surface d'écriture doivent être protégées **avant tout déploiement public** (§8-8).
- **Maintenabilité** : le système doit rester maintenable par une équipe de 3 personnes ; privilégier la simplicité et les Connecteurs isolés (un Connecteur cassé n'affecte pas les autres Sources).
- **Observabilité** : chaque Ingestion laisse une trace exploitable (date, Source, ajouts/retraits, erreurs). Un Connecteur en échec doit être **visible** (pas d'échec silencieux) — enjeu direct de SM-C2.
- **Performance** : recherche web et API dans un délai raisonnable sur le volume attendu de Métadonnées. `[HYPOTHÈSE : cibles à définir.]`
- **Disponibilité** : le MVP tourne **en local** ; pas d'exigence de disponibilité publique ni de SLA en v1. La consultation web/API sera publique au déploiement.
- **Accessibilité / i18n** : interface au minimum utilisable ; documentation projet en français (convention Y'TILiKAN). `[HYPOTHÈSE : langue de l'interface à confirmer — FR/EN.]`

## 11. Contrat d'API publique (surface publique)

- L'API expose l'interrogation de l'Index **en lecture seule** (aucune écriture publique ; contributions/administration passent par la surface authentifiée).
- Réponses au format structuré `[HYPOTHÈSE : JSON, style REST]`, incluant pour chaque Dataset les Métadonnées normalisées et le lien de Redirection.
- Filtrage minimal : par Langue (code canonique) et par Tâche NLP.
- Politique de compatibilité : les changements cassant le contrat doivent être versionnés. `[HYPOTHÈSE : à préciser à l'architecture.]`

## 12. Contraintes et garde-fous

- **Coût** : zéro budget — voir §10. Aucune dépendance payante en v1.
- **Licences et attribution** : la licence de chaque Dataset est une Métadonnée référencée (ou « inconnu ») ; le produit redirige vers la Source et n'assume aucun droit sur les données.
- **Gouvernance des données** : aucune donnée de Dataset stockée ; l'Index ne contient que des Métadonnées publiques **et les données de Compte** (identité minimale nécessaire à l'authentification et à la Provenance). Ces données personnelles doivent être limitées au strict nécessaire et protégées (voir Sécurité §10). Le durcissement (chiffrement, politique de mots de passe, RGPD le cas échéant) est à cadrer au déploiement.
