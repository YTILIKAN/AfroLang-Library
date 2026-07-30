# Frontend — AfroLang-Library

Interface Next.js 16 pour la consultation publique et l'administration authentifiée.

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

Ouvrir http://localhost:3000/admin/datasets

Compte bouchon admin : `admin@afriland.org` / `admin123`

## Variables d'environnement

| Variable | Défaut | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | URL de l'API backend |

## Structure

```
frontend-app/
├── app/admin/datasets/   # Story 4.3
├── app/admin/accounts/   # Story 4.4
├── components/admin/     # Panneaux CRUD + navigation admin
├── components/auth/      # Garde Admin + login minimal
└── lib/api/              # Client API accounts (AD-3)
```
