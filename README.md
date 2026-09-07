# AfroLang-Library

> **La plus grande bibliothèque organisée de datasets de langues africaines — navigable, filtrable et adaptée aux besoins de recherche.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Made in Africa](https://img.shields.io/badge/made%20in-Africa-FF6B35.svg)]()

---

## Description

AfroLang-Library est une plateforme initiée par [Y'TILiKAN](https://www.linkedin.com/company/ytilikan/about/) dont la mission est de **centraliser, organiser et rendre accessibles** les datasets de langues africaines éparpillés sur le web.

Le continent africain abrite plus de **2 000 langues**, représentant une richesse linguistique et culturelle sans égale dans le monde. Pourtant, les ressources nécessaires au développement de modèles d'IA pour ces langues restent fragmentées, difficiles à trouver et peu documentées. Des langues comme le **Ghomala**, l'**Ewondo**, le **Swahili**, le **Wolof**, le **Yoruba** ou le **Fon** méritent d'être représentées dans les systèmes d'intelligence artificielle modernes.

AfroLang-Library répond à ce défi en proposant un **répertoire unifié et structuré** qui référence les datasets disponibles sur des plateformes telles que Hugging Face, Kaggle, Zindi, Masakhane, et bien d'autres. L'utilisateur peut rechercher des données pour une langue spécifique, filtrer par source, type de données ou tâche NLP, et être redirigé directement vers la ressource.

La plateforme ne stocke pas les données brutes des datasets, mais leurs **métadonnées normalisées** ; elle se met à jour par ingestion automatique afin de ne jamais devenir obsolète.

---

## Vision

### Court terme
- Construire le répertoire de référence pour les datasets de langues africaines, en indexant les sources existantes (Hugging Face, Kaggle, Zindi, Masakhane, OpenSLR, OPUS, etc.)
- Offrir une interface de recherche intuitive permettant de filtrer par langue, source, type de tâche (ASR, NMT, classification, NER…) et format de données
- Mettre en place un système d'indexation automatique pour rester synchronisé avec les nouvelles publications

### Long terme
- Devenir **la référence mondiale** pour quiconque travaille sur le NLP et l'IA pour les langues africaines
- Servir de base solide pour le **benchmarking des modèles d'IA** sur les langues africaines, à l'image de benchmarks comme GLUE ou SuperGLUE mais centré sur l'Afrique
- Encourager et faciliter la **création de nouveaux datasets** pour les langues sous-représentées ou absentes
- Fédérer une communauté de chercheurs, linguistes, développeurs et activistes culturels autour de la préservation et valorisation des langues africaines par l'IA
- Établir des partenariats avec des universités, institutions et organisations africaines œuvrant dans ce domaine

---

## État actuel

La plateforme est fonctionnelle de bout en bout : catalogue public, API de consultation, espace chercheur et console d'administration.

| Domaine | Fonctionnalités disponibles |
| --- | --- |
| Consultation publique | catalogue unifié (recherche, filtres, langues), fiche dataset avec lien vers la source, page de documentation API |
| API publique | `/api/v1/*` en lecture seule, réponses JSON normalisées, documentation OpenAPI |
| Comptes | inscription, connexion, session par jeton, rôles chercheur et admin |
| Contribution | soumission d'un dataset, gestion de ses propres contributions |
| Administration | gestion des datasets, gestion des comptes et des rôles, compte super admin protégé |
| Ingestion | connecteurs Hugging Face et Kaggle, normalisation langue et tâche, retrait des entrées obsolètes, journaux de synchronisation |

---

## Stack technique

| Couche | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest |
| Backend | Python 3.11, FastAPI, SQLModel, Pydantic Settings, pytest |
| Base de données | PostgreSQL 16 (SQLite possible en local) |
| Ingestion | connecteurs Hugging Face et Kaggle, exécutés au démarrage ou à la demande |
| Déploiement | Railway (un service backend, un service frontend) |

---

## Démarrage rapide

Prérequis : Python 3.11+, Node.js 20.9+, Docker.

```bash
# 1. Base de données
docker compose up -d postgres

# 2. Backend
cd backend-api
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # Windows ; sinon .venv/bin/pip
cp .env.example .env
.venv/Scripts/uvicorn main:app --reload --port 8000

# 3. Frontend (autre terminal)
cd frontend-app
cp .env.example .env.local
npm install
npm run dev
```

Interface : <http://localhost:3000> — API : <http://127.0.0.1:8000/docs>
Compte admin initial : `admin@afriland.org` / `admin123` (à changer avant toute mise en ligne).

Procédure détaillée, variables d'environnement, modes bouchon, migration de base, tests,
déploiement et dépannage : **[Documentation/installation.md](Documentation/installation.md)**.

---

## Structure du dépôt

```
AfroLang-Library/
├── backend-api/            # API FastAPI
│   ├── accounts/           # comptes, authentification, contribution, administration
│   ├── catalog/            # catalogue public, recherche, filtres, agrégation par langue
│   ├── core/               # configuration, base de données, modèles, recherche
│   ├── ingestion/          # connecteurs de sources et normalisation
│   ├── scheduler/          # ingestion à la demande (python -m scheduler)
│   ├── scripts/            # migration locale, import d'inventaire, super admin
│   └── tests/              # suite pytest
├── frontend-app/           # application Next.js
│   ├── app/                # routes (catalog, datasets, auth, contribute, admin, api-docs)
│   ├── components/         # composants catalogue, auth, admin
│   ├── lib/                # client API et configuration
│   └── test/               # suite vitest
├── Documentation/          # documentation projet (installation, architecture, contrats, epics)
└── docker-compose.yml      # PostgreSQL de développement
```

---

## API publique

Surface stable en lecture seule, sous `/api/v1` (alias interne `/catalog`).

| Endpoint | Rôle |
| --- | --- |
| `GET /api/v1` | description de l'API et liste des endpoints |
| `GET /api/v1/datasets` | liste paginée des datasets |
| `GET /api/v1/datasets/search` | recherche par langue ou terme libre |
| `GET /api/v1/datasets/filter` | filtrage combiné (langue, source, tâche, format) |
| `GET /api/v1/datasets/{id}` | fiche détaillée avec `source_url` |
| `GET /api/v1/languages/overview` | agrégation des ressources par langue |
| `GET /health`, `GET /health/db` | santé du service et de la base |

La surface authentifiée (`/accounts/*`) couvre l'inscription, la connexion, la contribution et
l'administration. Contrats détaillés : [Documentation/contracts/](Documentation/contracts/).

---

## Documentation

| Document | Contenu |
| --- | --- |
| [Installation](Documentation/installation.md) | mise en route, configuration, tests, déploiement, dépannage |
| [Fonctionnement](Documentation/fonctionnement.md) | rôle de chaque composante et parcours utilisateurs |
| [Architecture backend](Documentation/architecture-backend.md) | organisation du backend |
| [Architecture — colonne vertébrale](Documentation/architecture/ARCHITECTURE-SPINE.md) | décisions structurantes |
| [Contrats d'interface](Documentation/contracts/README.md) | contrats API et connecteurs, modes bouchon |
| [Migration de base locale](Documentation/backend/migration-base-locale.md) | rattrapage du schéma après un `git pull` |
| [Compte super admin](Documentation/backend/compte-super-admin.md) | protection et transfert du compte super admin |
| [Epics et stories](Documentation/epics/epics.md) | découpage produit |

---

## Langues couvertes (exemples)

AfroLang-Library vise à couvrir l'ensemble des langues africaines. Voici quelques exemples représentatifs :

| Langue | Région | Famille |
|---|---|---|
| Swahili | Afrique de l'Est | Bantoue |
| Yoruba | Afrique de l'Ouest | Niger-Congo |
| Amharique | Afrique de l'Est | Sémitique |
| Wolof | Afrique de l'Ouest | Niger-Congo |
| Ghomala | Cameroun | Bantoue |
| Ewondo | Cameroun | Bantoue |
| Haoussa | Afrique de l'Ouest | Afro-asiatique |
| Fon | Bénin | Niger-Congo |
| Zulu | Afrique du Sud | Bantoue |
| Twi | Ghana | Niger-Congo |

> Et bien plus encore — des suggestions pour ajouter de nouvelles langues sont les bienvenues.

---

## Contribuer

- Le code et l'interface sont documentés en **français**.
- Toute documentation non technique (`.md`, `.pdf`, etc.) vit sous `Documentation/`, dans un sous-dossier par domaine.
- Avant d'ouvrir une pull request : `python -m pytest` côté backend, `npm test`, `npx tsc --noEmit` et `npx eslint .` côté frontend.
- Les contrats d'API sont figés dans [Documentation/contracts/](Documentation/contracts/) : toute évolution de surface passe par une mise à jour du contrat correspondant.

---

## Contact et communauté

- Organisation : [Y'TILiKAN](https://www.linkedin.com/company/ytilikan/about/)
- LinkedIn : [@ytilikan](https://www.linkedin.com/company/ytilikan/)
- Pour toute collaboration ou partenariat, ouvrez une issue ou contactez-nous via LinkedIn

---

## Licence

Ce projet est distribué sous licence **MIT**.

---

<p align="center">
  Fait pour les langues africaines — par <strong>Y'TILiKAN</strong><br/>
  <em>Démocratiser l'IA en Afrique</em>
</p>
