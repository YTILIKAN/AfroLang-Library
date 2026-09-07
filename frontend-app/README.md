# Frontend — AfroLang-Library

Interface Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4) pour la consultation
publique du catalogue, la contribution des chercheurs et l'administration.

Installation complète du projet (base de données, backend, variables d'environnement,
déploiement) : [Documentation/installation.md](../Documentation/installation.md).

## Démarrage local

```powershell
# Terminal 1 — API (bouchon possible pour travailler sans base)
cd backend-api
copy .env.example .env
.\.venv\Scripts\uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend-app
copy .env.example .env.local
npm install
npm run dev
```

Ouvrir <http://localhost:3000>. Exemple de recherche :
<http://localhost:3000/catalog?language=yoruba>

Compte admin initial : `admin@afriland.org` / `admin123`.

Pour travailler sans PostgreSQL, poser `CATALOG_STUB=true` et `ACCOUNTS_STUB=true` dans
`backend-api/.env` — voir [Documentation/contracts/README.md](../Documentation/contracts/README.md).

## Variables d'environnement

| Variable | Défaut | Description |
| --- | --- | --- |
| `API_URL` | `http://127.0.0.1:8001` en développement | URL du backend pour le rendu serveur et le proxy `/api-backend/*` |
| `NEXT_PUBLIC_API_URL` | non défini | URL du backend appelée directement par le navigateur. Si absente, le navigateur passe par le proxy `/api-backend` |
| `DEV_ALLOWED_ORIGINS` | vide | origines de développement supplémentaires (IP du réseau local, tunnel, machine virtuelle) |

## Pages

| Route | Rôle |
| --- | --- |
| `/` | accueil, compteurs du catalogue et entrée de recherche |
| `/catalog` | catalogue unifié : recherche, filtres combinés et exploration par langue (`GET /api/v1/datasets/search`, `/filter`) |
| `/languages/{langue}` | fiche langue et agrégation des ressources (`GET /api/v1/languages/overview`) |
| `/datasets/{id}` | fiche dataset et lien vers la source d'origine |
| `/api-docs` | documentation de l'API publique côté produit |
| `/auth/login`, `/auth/register` | connexion et création de compte |
| `/contribute` | espace chercheur, authentification requise |
| `/contribute/submit` | soumission d'un dataset (`POST /accounts/datasets`) |
| `/contribute/mine` | gestion de ses contributions (`GET/PATCH/DELETE /accounts/datasets/mine|{id}`) |
| `/admin/datasets` | administration des datasets, rôle Admin (`/accounts/admin/datasets`) |
| `/admin/accounts` | gestion des comptes et des rôles, rôle Admin (`/accounts/admin/accounts`) |

`/search`, `/filter` et `/languages` sont conservées comme redirections permanentes vers
`/catalog`, qui accepte les mêmes paramètres de requête.

## Structure

```
frontend-app/
├── app/                  # routes App Router
├── components/catalog/   # recherche, filtres, cartes et fiche dataset
├── components/home/      # sections de l'accueil
├── components/auth/      # AuthProvider, gardes de rôle, formulaires
├── components/contribute/# soumission et gestion des contributions
├── components/admin/     # panneaux CRUD datasets et comptes
├── components/docs/      # rendu de la documentation API
├── components/layout/    # en-tête, pied de page, navigation
├── components/ui/        # éléments d'interface partagés
├── lib/api/              # clients API catalog et accounts
├── lib/config.ts         # résolution de l'URL du backend
└── test/                 # suite vitest, organisée par dossier de composants
```

## Vérifications

```bash
npm test              # vitest
npx tsc --noEmit      # types
npx eslint .          # lint
```

`npm run build` échoue tant que le dépôt est placé dans un chemin contenant une apostrophe : le
chemin du projet est injecté sans échappement dans du code généré. Cloner le dépôt dans un
chemin sans caractère spécial, ou s'appuyer sur les trois commandes ci-dessus et le serveur de
développement pour valider un changement.
