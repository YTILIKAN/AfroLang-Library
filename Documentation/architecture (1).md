# Architecture proposée — AfroLang-Library

> Document décrivant l'architecture recommandée pour la plateforme AfroLang-Library.

## Vue d'ensemble

AfroLang-Library doit être conçue comme une plateforme centrée sur les données, organisée en trois couches principales :

- Ingestion / Indexation
- Backend / cœur de données
- Application Web (Frontend) et services associés

Chaque couche est découplée pour permettre l'évolution, la scalabilité et l'intégration de modules de benchmarking futurs.

---

## 1. Ingestion / Indexation

- Connecteurs vers les sources : Hugging Face, Kaggle, Zindi, Masakhane, OpenSLR, OPUS, etc.
- Synchronisation automatique périodique (scheduler) pour maintenir le catalogue à jour.
- Normalisation et validation des métadonnées (langue, famille, tâche NLP, licence, taille, lien, date).
- Composants : adaptateurs de source, service d'ingestion, planificateur (Airflow/Prefect/Dagster ou cron), règles de validation, file d'attente pour traitements asynchrones.

## 2. Backend / Cœur de données

- Base de métadonnées centrale (ex. PostgreSQL) contenant les enregistrements : datasets, langues, sources, tâches, licences, historiques de mise à jour.
- Service API exposant la recherche, les filtres et les endpoints de consultation (REST ou GraphQL).
- Index de recherche pour des requêtes rapides et filtres complexes (Elasticsearch / Meilisearch / Typesense ou recherche full-text PostgreSQL).
- Gestion des audits, versions et statut d'indexation.

## 3. Frontend / Interface utilisateur

- SPA moderne (React + Next.js, Vue + Nuxt ou SvelteKit) offrant :
  - page de recherche et filtrage
  - pages par langue avec statistiques et couverture
  - page de détail pour chaque dataset (métadonnées + lien vers source)
  - tableau de bord d'administration pour superviser l'indexation
- Redirections vers les sources originales (Hugging Face, Kaggle, etc.)

## Composants transverses

- Authentification et autorisations (pour l'admin et contributions).
- Observabilité : logs, métriques, alerting (Prometheus, Grafana, Sentry).
- Stockage d'artefacts ou caches pour métadonnées lourdes (S3 ou stockage objet).
- Pipeline CI/CD pour déploiements automatisés (GitHub Actions, GitLab CI).

---

## Technologies recommandées

- Langage & API : `FastAPI` (Python) ou `NestJS` (TypeScript). `Django REST Framework` si besoin d'un admin intégré rapide.
- Orchestration / scheduler : `Airflow`, `Prefect` ou `Dagster` (ou `cron`/GitHub Actions pour MVP simple).
- Base de métadonnées : `PostgreSQL` (recommandé). Alternatives : MySQL ou SQLite pour MVP.
- Recherche : `Elasticsearch`, `Meilisearch` ou `Typesense` (ou Postgres full-text pour simplicité).
- Frontend : `Next.js` (React) ou `Nuxt` (Vue). Hébergement : Vercel / Netlify / platformes cloud.
- Stockage objet : `AWS S3`, `MinIO` ou équivalent pour métadonnées volumineuses.
- Monitoring & logs : `Prometheus` + `Grafana`, `Sentry`.

---

## Module benchmarking (évolution future)

- Service séparé consommant le catalogue pour lancer des évaluations (NLP / ASR).
- Frameworks : `Hugging Face Transformers`, `PyTorch` ou `TensorFlow`.
- Stockage des résultats et leaderboards (tableau de bord dédié).

---

## Organisation recommandée du dépôt

- `ingestion-service/` — connecteurs et pipelines d'indexation
- `backend-api/` — API, modèles, migrations, tests
- `frontend-app/` — application web
- `infrastructure/` — manifests k8s, terraform, scripts CI
- `docs/` — spécifications, data schema

---

## Points opérationnels

- Démarrer par un MVP simple : scripts Python d'ingestion + API `FastAPI` + Postgres + Meilisearch et un front Next.js minimal.
- Ajouter l'orchestration et la robustesse (retries, validations, tests) ensuite.

Fait pour servir de document de référence initial pour la mise en œuvre de la plateforme.
