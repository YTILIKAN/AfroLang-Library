---
title: AfroLang-Library
status: final
created: 2026-07-01
updated: 2026-07-01
---

# PRD : AfroLang-Library
*Titre de travail — à confirmer.*

## 0. Objet du document

Ce PRD s'adresse à l'équipe produit de Y'TILiKAN (3 personnes) et aux étapes aval de la méthode (UX, architecture, découpage en epics/stories). Il transforme le [product brief finalisé](../../briefs/brief-AfroLang-Library-2026-07-01/brief.md) en exigences précises. Il est structuré ainsi : vocabulaire ancré par un glossaire (§3), fonctionnalités regroupées avec exigences fonctionnelles (FR) numérotées globalement (§4), exigences non-fonctionnelles transverses (§10), hypothèses marquées `[HYPOTHÈSE]` en ligne et regroupées en §12. Les choix techniques (pile, mécanismes, technologie de stockage) ne figurent pas ici : ils vivent dans l'`addendum.md` de ce dossier et dans celui du brief, socles de l'étape architecture.

## 1. Vision

AfroLang-Library est un index vivant des datasets de langues africaines. Plus de 2 000 langues existent sur le continent, mais les données pour l'IA (NLP, ASR) sont éparpillées entre Hugging Face, Kaggle, Zindi, OpenSLR, OPUS et d'autres — mal nommées, mal documentées, difficiles à retrouver. Le produit référence les *métadonnées* de ces datasets dans un répertoire unifié, recherchable et filtrable, puis redirige vers la source. Il n'héberge aucune donnée.

Sa valeur centrale est un schéma unifié qui réconcilie les nommages incohérents des plateformes — en particulier l'identité de langue, ancrée sur des standards (ISO 639-3, complété par Glottolog) — pour qu'une recherche par langue ne rate jamais un dataset pertinent. L'index se synchronise automatiquement avec les sources : les nouveaux datasets apparaissent, les disparus sont retirés, sans intervention humaine.

Le produit est accessible de deux façons : une interface web de recherche/filtrage, et une API publique interrogeable par programme. À terme, il vise à devenir la référence mondiale pour l'IA des langues africaines et le socle d'un cadre de benchmarking. Ce PRD cadre le MVP, construit par une équipe de 3 personnes sans budget.

## 2. Utilisateur cible

### 2.1 Jobs To Be Done

- **Fonctionnel** : « Étant donné une langue africaine, trouver rapidement tous les datasets disponibles et comment y accéder, sans fouiller plusieurs plateformes. »
- **Fonctionnel** : « Filtrer les datasets par tâche NLP (ASR, traduction, NER…) et par source pour ne garder que ceux qui servent mon projet. »
- **Fonctionnel (développeur)** : « Interroger le répertoire par programme (API) pour intégrer la recherche de datasets dans mon propre pipeline. »
- **Contextuel** : « Avoir confiance que la liste est à jour — ni datasets fantômes, ni nouveautés manquées. »
- **Social / mission** : « Contribuer à rendre les langues africaines visibles dans l'IA moderne. »

### 2.2 Non-utilisateurs (v1)

- Le grand public non technique cherchant à *utiliser* une langue (traduction, apprentissage) — le produit référence des datasets, pas des outils grand public.
- Les producteurs de datasets voulant *publier* chez nous — le produit n'héberge ni ne reçoit de données en v1.
- Les contributeurs communautaires souhaitant enrichir l'index — pas de compte ni de soumission en v1.

### 2.3 Parcours utilisateurs clés

- **UJ-1. Aïcha cherche des données pour le Wolof depuis le web.**
  Aïcha, chercheuse en NLP dans une université ouest-africaine, démarre un projet de reconnaissance vocale en wolof. Non authentifiée (aucun compte requis), elle arrive sur AfroLang-Library, tape « Wolof » dans la recherche. Le système reconnaît la langue via son code canonique et retourne tous les datasets rattachés — quelle que soit la façon dont chaque plateforme l'avait nommée (« Wolof », « wol », « wo »). Elle filtre par tâche « ASR ». Chaque résultat affiche une fiche (langue, tâche, taille si connue, licence si connue, source). Elle clique et est redirigée vers la page Hugging Face du dataset. **Climax :** en une recherche, elle a la liste complète et fiable, sans avoir ouvert cinq plateformes. **Edge case :** un champ manquant (licence inconnue) s'affiche « inconnu » plutôt que de masquer le dataset.

- **UJ-2. Kwame interroge l'API depuis son pipeline.**
  Kwame, développeur, construit un pipeline d'entraînement multilingue. Il appelle l'API publique d'AfroLang-Library pour récupérer, au format structuré (JSON), tous les datasets de tâche « traduction » pour un ensemble de langues. Il intègre l'appel dans son script : à chaque exécution, il obtient l'état à jour de l'index. **Climax :** il n'a écrit aucun scraper maison ; une requête suffit. **Resolution :** son pipeline reste synchronisé avec les nouvelles publications sans effort de sa part.

- **UJ-3. Fatou explore la disponibilité pour le Ghomala.**
  Fatou, linguiste, veut savoir si le ghomala est représenté. Elle ouvre la page dédiée à la langue et voit d'un coup d'œil le nombre de datasets référencés et les tâches couvertes. **Resolution :** elle repart avec un état des lieux clair, même si la réponse est « peu de ressources » — un signal utile en soi.

## 3. Glossaire

*Les workflows aval et le document lui-même utilisent ces termes exactement, sans synonyme.*

- **Dataset** — Un jeu de données de langue(s) africaine(s) publié sur une Source externe. AfroLang-Library en référence les Métadonnées, jamais le contenu.
- **Source** — Une plateforme externe hébergeant des Datasets (Hugging Face, Kaggle, Zindi, OpenSLR, OPUS…). Une Source est intégrée via un Connecteur.
- **Connecteur** — Le composant qui, pour une Source donnée, récupère et met à jour ses Datasets via l'API de la Source. Un Connecteur par Source ; nouvelles Sources ajoutées en ajoutant des Connecteurs.
- **Métadonnée** — Une propriété décrivant un Dataset : Langue, Tâche NLP, type/format de données, taille, licence, date de publication, lien d'accès. Jamais le contenu du Dataset.
- **Langue** — Une langue identifiée par son **code canonique** ISO 639-3 (Glottolog en repli si l'ISO ne couvre pas). Toute valeur brute d'une Source est mappée vers ce code canonique.
- **Tâche NLP** — Le type d'usage d'un Dataset, exprimé dans un **vocabulaire contrôlé** fixe (ex. ASR, Traduction, NER, Classification, TTS, Résumé).
- **Index** — L'ensemble unifié et normalisé des Métadonnées de tous les Datasets référencés, **persisté** dans un stockage durable. C'est ce qu'exposent l'interface web et l'API.
- **Synchronisation** — Le processus automatique et périodique qui met l'Index en accord avec l'état réel des Sources (ajout des nouveaux Datasets, retrait des disparus).
- **Fiche dataset** — La présentation, dans l'interface web, des Métadonnées normalisées d'un Dataset, avec le lien de Redirection.
- **Redirection** — Le renvoi de l'utilisateur vers le Dataset sur sa Source d'origine.
- **Inconnu** — Valeur affichée pour une Métadonnée absente ou non déterminable ; n'empêche jamais le référencement du Dataset.

## 4. Fonctionnalités

### 4.1 Ingestion et synchronisation automatique

**Description :** Le système alimente et maintient l'Index en interrogeant chaque Source via son Connecteur, à intervalle régulier et sans intervention humaine. L'ancrage MVP est Hugging Face et Kaggle ; toute Source disposant d'une API gratuite exploitable peut être ajoutée via un nouveau Connecteur. Réalise UJ-1, UJ-2, UJ-3.

**Functional Requirements :**

#### FR-1 : Connecteur de source
Le système peut ingérer les Datasets d'une Source via son API et en extraire les Métadonnées brutes. L'ajout d'une nouvelle Source se fait par l'ajout d'un Connecteur, sans refonte du reste du système.
**Consequences (testables) :**
- Un Connecteur Hugging Face et un Connecteur Kaggle existent et peuplent l'Index au lancement.
- Ajouter une Source supplémentaire (ex. Zindi) ne requiert que l'écriture d'un nouveau Connecteur respectant un contrat commun.
**Out of Scope :** Sources sans API (traitées par scraping en phase 2 — voir §5, §6.2).

#### FR-2 : Synchronisation planifiée
Le système ré-interroge automatiquement chaque Source à intervalle régulier, sans action manuelle. `[HYPOTHÈSE : fréquence par défaut quotidienne, à confirmer.]`
**Consequences (testables) :**
- La Synchronisation s'exécute selon un planning défini, sans qu'un membre de l'équipe la déclenche.
- Chaque exécution produit une trace consultable (date, Source, nombre d'ajouts/retraits) — voir NFR observabilité §10.

#### FR-3 : Retrait des datasets disparus
Quand un Dataset n'est plus renvoyé par sa Source, le système le retire de l'Index.
**Consequences (testables) :**
- Un Dataset absent de la réponse de la Source lors d'une Synchronisation n'apparaît plus dans les résultats web ni API à l'issue de celle-ci.

#### FR-4 : Ajout des nouveaux datasets
Quand un nouveau Dataset apparaît sur une Source, le système l'ajoute à l'Index à la Synchronisation suivante, après Normalisation (§4.2).
**Consequences (testables) :**
- Un Dataset publié sur une Source intégrée devient consultable (web + API) après la Synchronisation suivante, sans intervention.

#### FR-5 : Ajout manuel d'une entrée sans API (solution d'attente phase 1)
Un membre de l'équipe peut ajouter manuellement à l'Index un Dataset ou une Source importante ne disposant pas d'API.
**Consequences (testables) :**
- Une entrée manuelle est référençable et distinguable d'une entrée synchronisée (elle n'est pas soumise à la Synchronisation automatique).
**Notes :** `[NOTE FOR PM]` Une entrée manuelle peut devenir obsolète (Dataset disparu non détecté) jusqu'à la phase 2/scraping. Compromis assumé au brief.

### 4.2 Normalisation vers un schéma unifié

**Description :** Chaque Dataset ingéré est ramené à un schéma commun avant d'entrer dans l'Index. C'est le cœur de valeur : sans normalisation, la recherche par langue échoue. Réalise UJ-1, UJ-3.

**Functional Requirements :**

#### FR-6 : Normalisation de l'identité de langue
Le système mappe la valeur de langue brute d'une Source vers le code canonique de la **Langue** (ISO 639-3 ; Glottolog en repli).
**Consequences (testables) :**
- Deux Datasets décrits « Wolof » et « wol » sur deux Sources différentes sont rattachés au même code canonique et remontent ensemble à une recherche « Wolof ».
- Une valeur de langue non mappable est signalée pour revue plutôt que silencieusement perdue.

#### FR-7 : Normalisation de la tâche NLP
Le système mappe le tag de tâche brut d'une Source vers une valeur du vocabulaire contrôlé **Tâche NLP**.
**Consequences (testables) :**
- Les filtres par Tâche NLP opèrent sur le vocabulaire contrôlé, pas sur les tags bruts hétérogènes.

#### FR-8 : Gestion des métadonnées manquantes
Quand une Métadonnée est absente ou non déterminable, le système la marque **Inconnu** et référence quand même le Dataset.
**Consequences (testables) :**
- Un Dataset sans licence indiquée apparaît dans les résultats, licence affichée « inconnu ».

### 4.3 Stockage et persistance de l'Index

**Description :** L'Index — l'ensemble des Métadonnées normalisées — est persisté dans un stockage durable qui est la **source unique** lue par l'interface web (§4.4) et l'API (§4.6). Le stockage ne contient que des Métadonnées : jamais le contenu des Datasets. La Synchronisation (§4.1) écrit dans ce stockage ; le web et l'API n'y accèdent qu'en lecture. La technologie de stockage n'est pas fixée ici (voir addendum) mais est contrainte par le coût nul (§10).

**Functional Requirements :**

#### FR-9 : Persistance de l'Index
Le système persiste les Métadonnées normalisées dans un stockage durable ; l'Index survit aux redémarrages et entre deux Synchronisations, et reste servi même quand aucune Synchronisation n'est en cours.
**Consequences (testables) :**
- Après un redémarrage du système sans nouvelle Synchronisation, une recherche retourne les mêmes Datasets qu'avant.
- Le web et l'API lisent les mêmes données persistées (cohérence des résultats).
- Le stockage ne contient aucun fichier/contenu de Dataset, uniquement des Métadonnées et le lien de Redirection.

#### FR-10 : Mise à jour atomique par la synchronisation
Une Synchronisation met à jour l'Index sans laisser les lecteurs (web/API) sur un état incohérent (par ex. index vidé en cours de traitement). `[HYPOTHÈSE : stratégie de mise à jour à préciser à l'architecture.]`
**Consequences (testables) :**
- Pendant une Synchronisation, une recherche continue de renvoyer un Index cohérent (l'ancien état ou le nouvel état complet, pas un état partiel vide).

**Notes :** `[NOTE FOR PM]` Le **modèle de données** (champs persistés par Dataset) découle du Glossaire (§3, Métadonnée) : identifiant, Source, code de Langue canonique, Tâche(s) NLP, taille, licence, date de publication, lien de Redirection, origine (synchronisée vs manuelle). Sa forme concrète (tables/collections) est un livrable de l'architecture.

### 4.4 Recherche et filtrage (interface web)

**Description :** L'interface web permet à un visiteur non authentifié de trouver des Datasets par Langue et de les affiner. Réalise UJ-1.

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

**Description :** Le produit expose son Index par programme, pour l'utilisateur développeur. Réalise UJ-2.

**Functional Requirements :**

#### FR-15 : Interrogation de l'index par API
Un client peut interroger l'Index via une API publique et récupérer les Métadonnées normalisées au format structuré (JSON), avec au minimum le filtrage par Langue et par Tâche NLP.
**Consequences (testables) :**
- Une requête API filtrant par Langue et Tâche NLP renvoie le même ensemble que l'interface web pour les mêmes critères.
- Chaque Dataset renvoyé inclut le lien de Redirection vers sa Source.
**Feature-specific NFRs :** contrat d'API stable et documenté (voir §11).

## 5. Non-Goals (explicites)

- Le produit **n'héberge, ne stocke, ne sert aucune donnée** de Dataset ; il ne stocke que des Métadonnées et redirige.
- Le produit **n'est pas** un outil grand public de traduction ou d'apprentissage de langues.
- Le produit **ne collecte pas** de contributions communautaires en v1 (pas de compte, pas de soumission).
- Le produit **ne scrape pas** les Sources sans API en v1 (phase 2).
- Le produit **n'est pas** encore une plateforme de benchmarking (phase future).

## 6. Périmètre MVP

### 6.1 Dans le périmètre

- Ingestion + Synchronisation automatique des Sources à API, ancrées sur Hugging Face et Kaggle (extensible à toute Source à API gratuite via Connecteur).
- Normalisation : Langue (ISO 639-3 + Glottolog), Tâche NLP (vocabulaire contrôlé), « inconnu » pour les champs manquants.
- Persistance de l'Index dans un stockage durable et gratuit (source unique pour web + API).
- Interface web : recherche par Langue, filtres (Source, Tâche NLP, format), Fiche dataset, Redirection.
- Pages par Langue (version simple).
- API publique d'interrogation de l'Index.
- Ajout manuel d'entrées sans API (solution d'attente).
- Accès en lecture seule, **sans compte ni authentification**.

### 6.2 Hors périmètre MVP

- Scraping des Sources sans API — *phase 2* (raison : fragile et coûteux à maintenir à 3 sans budget).
- Cadre de benchmarking et leaderboards — *phase future*.
- Comptes utilisateurs, favoris, soumissions communautaires. `[NOTE FOR PM : la soumission de sources par la communauté est un accélérateur de couverture ; à revisiter après le MVP.]`
- Tableaux de bord statistiques riches (évolution temporelle, couverture par famille/région).
- Déduplication automatique d'un même Dataset présent sur plusieurs Sources. `[NOTE FOR PM : à évaluer en phase 2 ; en MVP les doublons inter-sources sont tolérés.]`
- Hébergement de données.

## 7. Métriques de succès

*Cibles chiffrées laissées ouvertes, à caler par l'équipe (cohérent avec le brief).*

**Primaires**
- **SM-1 — Fiabilité de la requête clé** : une recherche par Langue retourne l'ensemble complet des Datasets pertinents, sans manque dû au nommage. Mesure : sur un échantillon de Langues à variantes connues, aucun Dataset attendu n'est manquant. Valide FR-6, FR-11.
- **SM-2 — Couverture** : nombre de Langues et de Datasets référencés. Valide FR-1, FR-4. `[Cible à définir.]`
- **SM-3 — Fraîcheur** : l'Index reflète l'état réel des Sources à API sans intervention manuelle (ajouts/retraits automatiques effectifs). Valide FR-2, FR-3, FR-4.

**Secondaires**
- **SM-4 — API opérationnelle** : l'API publique répond de façon fiable et renvoie les mêmes résultats que l'interface web pour des critères identiques. Valide FR-15.
- **SM-5 — Adoption** : usage réel (visites web + appels API). `[Cible à définir.]`

**Contre-métriques (à ne pas optimiser)**
- **SM-C1 — Sur-couverture au détriment de la qualité** : ne pas gonfler SM-2 en référençant des Datasets mal normalisés ou hors périmètre (langues non africaines, entrées non vérifiées). Contrebalance SM-2.
- **SM-C2 — Faux « à jour »** : ne pas masquer des Connecteurs cassés pour préserver l'apparence de fraîcheur ; un échec de Synchronisation doit être visible (voir §10). Contrebalance SM-3.

## 8. Questions ouvertes

1. Quelles Sources au-delà de Hugging Face et Kaggle disposent réellement d'une API gratuite exploitable (Zindi, OPUS, OpenSLR, Masakhane…) ? Recherche à mener avant de planifier les Connecteurs suivants.
2. Fréquence de Synchronisation par défaut (quotidienne ? hebdomadaire ?) et contraintes de quotas/limites des API des Sources.
3. Liste définitive du vocabulaire contrôlé des Tâches NLP (FR-7).
4. Comment identifier de façon fiable qu'un Dataset concerne une **langue africaine** (filtrage à l'ingestion) pour éviter le bruit (SM-C1) ?
5. Politique vis-à-vis des conditions d'utilisation / attribution de chaque Source lors du référencement des Métadonnées et de la Redirection.
6. Cibles chiffrées de succès (SM-2, SM-5) et date de mise en ligne visée.

## 9. Index des hypothèses

- FR-2 — Fréquence de Synchronisation par défaut supposée quotidienne, à confirmer.
- FR-10 — Stratégie de mise à jour atomique de l'Index à préciser à l'architecture.
- §4.6 / §11 — Format d'API supposé JSON, style REST ; à confirmer à l'architecture.
- §11 — Politique de versionnement du contrat d'API à préciser à l'architecture ; contrat simple et documenté suffit en v1.
- §10 — Cibles de performance (temps de réponse web/API) à définir à l'architecture.
- §10 — Langue de l'interface (FR/EN) à confirmer.
- Ancrage Sources — suppose que les API Hugging Face et Kaggle exposent les Métadonnées nécessaires (langue, tâche, licence, taille) de façon exploitable.

## 10. Exigences non-fonctionnelles transverses

- **Coût (contrainte dure)** : toute la solution doit fonctionner à coût nul ou quasi nul — hébergement web, exécution de la Synchronisation, **et stockage de l'Index inclus**. Chaque choix d'architecture se juge à cette aune. Voir addendum (pistes gratuites de stockage et de planificateur).
- **Maintenabilité** : le système doit rester maintenable par une équipe de 3 personnes non dédiées à plein temps ; privilégier la simplicité et les Connecteurs isolés (un Connecteur cassé n'affecte pas les autres Sources).
- **Observabilité** : chaque Synchronisation laisse une trace exploitable (date, Source, ajouts/retraits, erreurs). Un Connecteur en échec doit être **visible** (pas d'échec silencieux) — enjeu direct de SM-C2.
- **Performance** : la recherche web et l'API répondent dans un délai raisonnable sur le volume attendu de Métadonnées (texte structuré, pas de gros fichiers). `[HYPOTHÈSE : cibles précises à définir à l'architecture.]`
- **Disponibilité** : interface web et API accessibles publiquement ; pas d'exigence de SLA formel en v1.
- **Accessibilité / i18n** : interface au minimum utilisable ; documentation projet en français (convention Y'TILiKAN). `[HYPOTHÈSE : langue de l'interface à confirmer — FR/EN.]`

## 11. Contrat d'API publique (surface publique)

- L'API expose l'interrogation de l'Index en lecture seule (pas d'écriture publique).
- Réponses au format structuré `[HYPOTHÈSE : JSON, style REST]`, incluant pour chaque Dataset les Métadonnées normalisées et le lien de Redirection.
- Filtrage minimal : par Langue (code canonique) et par Tâche NLP.
- Politique de compatibilité : les changements cassant le contrat doivent être versionnés. `[HYPOTHÈSE : à préciser à l'architecture ; en v1, contrat simple et documenté suffit.]`

## 12. Contraintes et garde-fous

- **Coût** : zéro budget — voir §10. Aucune dépendance payante en v1, stockage compris.
- **Licences et attribution** : la licence de chaque Dataset est une Métadonnée référencée (ou « inconnu ») ; le produit redirige vers la Source et n'assume aucun droit sur les données. Respect des conditions d'utilisation des API des Sources (voir Question ouverte 5).
- **Gouvernance des données** : aucune donnée de Dataset stockée ; uniquement des Métadonnées publiques. Empreinte de données personnelle nulle en v1 (pas de comptes).
