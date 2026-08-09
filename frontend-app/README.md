# Frontend — AfroLang-Library

Interface Next.js 16 pour la consultation publique et l'administration authentifiée.

## Story 3.4 — Authentification chercheur

Pages :
- [`/auth/login`](http://localhost:3000/auth/login) — connexion
- [`/auth/register`](http://localhost:3000/auth/register) — création de compte
- [`/contribute`](http://localhost:3000/contribute) — espace contribution (authentification requise)

La consultation publique (`/search`, `/filter`, `/languages`) reste accessible sans compte.

## Story 3.5 — Soumission d'un dataset

Page : [`/contribute/submit`](http://localhost:3000/contribute/submit) — `POST /accounts/datasets` (bouchon si `ACCOUNTS_STUB=true`)

## Story 3.6 — Mes datasets

Page : [`/contribute/mine`](http://localhost:3000/contribute/mine) — `GET/PATCH/DELETE /accounts/datasets/mine|{id}`

## Story 3.4 — Authentification chercheur

Pages :
- [`/languages`](http://localhost:3000/languages) — sélection d'une langue
- [`/languages/Yoruba`](http://localhost:3000/languages/Yoruba) — agrégation via `GET /api/v1/languages/overview`

## Story 2.4 — Interface de filtres

Page : [`/filter`](http://localhost:3000/filter) — filtrage combiné via `GET /api/v1/datasets/filter`

Exemple : http://localhost:3000/filter?language=Swahili&task=classification

## Story 1.12 — Recherche et fiches dataset

Pages :
- [`/search`](http://localhost:3000/search) — recherche par langue (`GET /api/v1/datasets/search`)
- [`/datasets/{id}`](http://localhost:3000/datasets/1) — fiche métadonnées + lien vers la source (FR-13)

## Story 4.3 — Administration des datasets

Page : [`/admin/datasets`](http://localhost:3000/admin/datasets)

- Liste tous les datasets via `GET /accounts/admin/datasets`
- Création, modification, suppression (contrat Story 4.1)
- Accès réservé au rôle **Admin** (vérification côté API + garde UI)

## Story 4.4 — Gestion des comptes

Page : [`/admin/accounts`](http://localhost:3000/admin/accounts)

- Liste, création, attribution de rôles et désactivation via `GET/POST/PATCH /accounts/admin/accounts`
- Contrat Story 4.2 — accès Admin uniquement

## Démarrage local

```powershell
# Terminal 1 — API (bouchon recommandé pour le frontend seul)
cd backend-api
$env:ACCOUNTS_STUB="true"
$env:CATALOG_STUB="true"
.\.venv\Scripts\uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend-app
copy .env.example .env.local
npm install
npm run dev
```

Ouvrir http://localhost:3000 — recherche : http://localhost:3000/search?language=yoruba

Compte bouchon admin : `admin@afriland.org` / `admin123`

## Variables d'environnement

| Variable | Défaut | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | URL de l'API backend |

## Structure

```
frontend-app/
├── app/contribute/       # Story 3.4+ — espace chercheur (gate)
├── app/auth/             # Story 3.4 — login / register
├── app/languages/        # Story 2.5 — page par langue
├── app/filter/           # Story 2.4 — filtres combinés
├── app/search/           # Story 1.12 — recherche par langue
├── app/datasets/[id]/    # Story 1.12 — fiche dataset
├── app/admin/datasets/   # Story 4.3
├── app/admin/accounts/   # Story 4.4
├── components/catalog/   # Cartes, fiche, formulaire de recherche
├── components/admin/     # Panneaux CRUD + navigation admin
├── components/auth/      # AuthProvider, gates, formulaires
└── lib/api/              # Client API catalog + accounts (AD-3)
```
