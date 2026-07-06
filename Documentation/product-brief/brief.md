---
title: "Product Brief: AfroLang-Library"
status: final
created: 2026-07-01
updated: 2026-07-01
---

# Product Brief : AfroLang-Library

## Résumé exécutif

AfroLang-Library est un **index vivant des datasets de langues africaines**. Le continent compte plus de 2 000 langues, mais les données nécessaires pour construire des modèles d'IA (NLP, ASR) sont éparpillées entre Hugging Face, Kaggle, Zindi, Masakhane, OpenSLR, OPUS et d'autres — mal nommées, mal documentées, difficiles à retrouver. Un chercheur qui veut savoir « existe-t-il des données pour le Ghomala ? » doit fouiller une dizaine de plateformes, chacune avec son propre vocabulaire.

AfroLang-Library résout ce problème en **référençant les métadonnées** de ces datasets (langue, tâche NLP, taille, licence, lien d'accès) dans un répertoire unifié, recherchable et filtrable, puis en **redirigeant vers la source**. Le projet n'héberge aucune donnée : il expose *comment y accéder*. Son cœur de valeur est un **schéma unifié** ancré sur des standards linguistiques (ISO 639-3 + Glottolog), qui réconcilie les nommages incohérents des plateformes pour qu'une recherche par langue ne rate jamais un dataset pertinent. L'index se **synchronise automatiquement** : les nouveaux datasets apparaissent, les disparus sont retirés, sans intervention humaine.

Porté par Y'TILiKAN, le projet vise à devenir la référence mondiale pour quiconque travaille sur l'IA des langues africaines — et, à terme, le socle d'un cadre de benchmarking pour ces langues. Ce brief cadre la première version, construite par une équipe de 3 personnes sans budget, et sert de socle aux étapes de conception suivantes (PRD, architecture).

## Le problème

Les données pour les langues africaines existent, mais elles sont **invisibles à l'échelle pratique** :

- **Éparpillement** : un dataset de Wolof peut être sur Hugging Face, un de Fon sur Zindi, un de Swahili sur OpenSLR. Aucun point d'entrée unique.
- **Nommage incohérent** : le même Yoruba apparaît comme `Yoruba`, `yor`, `yo`, `Yorùbá`. Beaucoup de langues africaines ont des codes ISO manquants, en conflit, ou noyés sous des variantes dialectales (Akan / Twi / Fante…). Résultat : une recherche naïve rate la moitié des résultats.
- **Documentation pauvre** : tâche NLP, licence, taille souvent absentes ou décrites différemment d'une plateforme à l'autre.
- **Obsolescence** : les listes manuelles existantes se périment vite — datasets qui disparaissent, nouveaux qui ne sont jamais ajoutés.

Le coût du statu quo : les chercheurs et développeurs perdent un temps considérable en recherche manuelle, réinventent des inventaires, ou pire, concluent à tort qu'« il n'y a pas de données » pour une langue — freinant l'inclusion de ces langues dans l'IA moderne.

## La solution

Un **répertoire de métadonnées, synchronisé automatiquement**, accessible de deux façons :

- **Une interface web** de recherche et de filtrage (par langue, source, tâche NLP, format), avec redirection directe vers la ressource d'origine.
- **Une API publique** exposant l'index, pour que les chercheurs et développeurs interrogent le répertoire par programme.

Le fonctionnement :

1. **Collecte automatique** via les **API officielles** des plateformes (Hugging Face Hub, Kaggle, etc.).
2. **Normalisation** de chaque dataset vers un **schéma unifié** : l'identité de langue est ramenée à un code canonique **ISO 639-3** (avec **Glottolog** en repli), la tâche NLP à un **vocabulaire contrôlé**. Les champs manquants sont affichés « inconnu » — le dataset reste référencé.
3. **Synchronisation continue** : ajout des nouveaux datasets, retrait de ceux qui ont disparu, sans intervention humaine, via un planificateur gratuit.

## Ce qui rend ce projet différent

- **La normalisation d'identité de langue pour l'Afrique** — c'est l'avantage réel et défendable. Réconcilier les nommages hétérogènes vers ISO 639-3 + Glottolog est un travail spécifique que les plateformes généralistes ne font pas. C'est ce qui fait que « chercher une langue » retourne *tous* les datasets pertinents.
- **Un index vivant, pas une liste morte** : la synchro automatique garantit que le répertoire reflète l'état réel des sources — là où les inventaires manuels existants se périment.
- **Spécialisé, pas généraliste** : entièrement dédié aux langues africaines, là où Hugging Face ou Kaggle noient ces datasets dans la masse.

Honnêteté sur le « moat » : la barrière n'est pas technique au sens d'une techno rare, mais tient à la **qualité et l'entretien de la normalisation linguistique** et à la focalisation. C'est un avantage d'exécution et de spécialisation, pas un secret technologique.

## Qui ça sert

**Utilisateur primaire — le chercheur / développeur en NLP** travaillant sur les langues africaines. Il sait quelle langue l'intéresse et veut, en une requête (web ou API), la liste complète et fiable des datasets disponibles, avec le lien pour y accéder. Son succès : ne plus perdre de temps à fouiller plusieurs plateformes, et ne rien manquer à cause d'un problème de nommage.

**Utilisateurs secondaires** (bénéficient sans être la cible de la v1) : linguistes, activistes culturels, institutions et universités africaines, et à terme la communauté qui suivra la disponibilité des ressources par langue.

## Critères de succès

Pour cette v1 interne, quatre signaux honnêtes :

1. **Couverture** — nombre de langues africaines et de datasets référencés.
2. **La requête clé est fiable** — chercher une langue retourne tous les datasets pertinents, sans manque dû au nommage. C'est le test central de la valeur.
3. **Fraîcheur** — l'index reflète l'état réel des sources à API sans intervention manuelle (ajouts/retraits automatiques).
4. **L'API exposée fonctionne bien** — interrogeable de façon fiable par les utilisateurs primaires.

_(Cibles chiffrées — nombre de langues/datasets, date de mise en ligne — à fixer par l'équipe.)_

## Périmètre

**Dans la v1**
- Index de métadonnées (aucun hébergement de données).
- Synchronisation automatique des sources disposant d'une **API officielle**.
- Schéma unifié : identité de langue en **ISO 639-3 + Glottolog**, tâche NLP en vocabulaire contrôlé, « inconnu » pour les champs manquants.
- **Interface web** de recherche et de filtrage, avec redirection vers la source.
- **API publique** exposant l'index.
- Ajout **manuel** d'une poignée de sources importantes sans API (solution d'attente, non synchronisée — voir Risques).
- Synchro via planificateur gratuit — piste : GitHub Actions/cron `[HYPOTHÈSE, à confirmer en architecture]`.

**Hors v1 (plus tard)**
- **Phase 2** : algorithme de **scraping** pour automatiser les sources sans API.
- **Phase future** : cadre de **benchmarking** et leaderboards pour les langues africaines.
- Hébergement de données ; contributions communautaires.

## Risques et questions ouvertes

- **Ressources humaines (le risque n°1)** : équipe de 3, zéro budget. Mitigation adoptée : la v1 se limite aux sources à API (synchro fiable et gratuite) ; le scraping fragile, coûteux à maintenir, est repoussé en phase 2. Chaque choix d'architecture doit rester gratuit et maintenable par 3 personnes.
- **Entrées manuelles obsolètes** : les sources sans API ajoutées à la main ne se synchronisent pas et peuvent pointer vers des datasets disparus jusqu'à la phase 2. Compromis assumé pour ne pas retarder la v1.
- **Silence des scrapers/synchro** : un connecteur qui casse sans alerte laisse l'index se dégrader sans que personne ne le voie. Prévoir un minimum de surveillance.
- **Couverture réelle par API** : à vérifier — quelles sources majeures ont réellement une API exploitable et gratuite (OpenSLR, Masakhane… ?).
- **Pile technique non tranchée** : Next.js (front) / Python (back) évoqués mais non confirmés — voir l'addendum, à décider en architecture.
- **Cibles chiffrées de succès** non fixées.

## Vision

Si la v1 réussit, AfroLang-Library devient **la référence mondiale** pour trouver des données de langues africaines. En automatisant le scraping (phase 2), il couvre l'intégralité des sources ; en ajoutant un cadre de benchmarking (phase future), il devient l'équivalent africain de GLUE/SuperGLUE — un socle pour évaluer et faire progresser les modèles d'IA sur ces langues. À 2-3 ans : un carrefour fédérant chercheurs, linguistes, développeurs et institutions autour de la préservation et de la valorisation des langues africaines par l'IA — au service de la mission de Y'TILiKAN, démocratiser l'IA en Afrique.
