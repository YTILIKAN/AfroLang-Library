# Installation et démarrage local

Guide d'installation complet d'AfroLang-Library : backend FastAPI, frontend Next.js et base
PostgreSQL. Les commandes sont données en variante PowerShell (Windows) et en variante shell
POSIX (Linux, macOS).

## 1. Prérequis

| Outil | Version | Vérification | Usage |
| --- | --- | --- | --- |
| Python | 3.11 ou plus récent | `python --version` | backend FastAPI, ingestion, scripts |
| Node.js | 20.9 ou plus récent | `node --version` | frontend Next.js 16 |
| npm | 10 ou plus récent | `npm --version` | dépendances frontend |
| Docker Desktop | récent | `docker --version` | PostgreSQL local via `docker-compose.yml` |
| Git | récent | `git --version` | récupération du dépôt |

Docker n'est nécessaire que pour PostgreSQL. Une base SQLite locale reste possible (section 3.2),
mais PostgreSQL est la cible de production et le mode recommandé.

## 2. Récupérer le dépôt

```bash
git clone https://github.com/YTILIKAN/AfroLang-Library.git
cd AfroLang-Library
```

Choisir un chemin de travail sans apostrophe ni caractère spécial : le compilateur Next.js
injecte le chemin du projet dans du code généré et échoue au build sinon (section 12).

## 3. Base de données

### 3.1 PostgreSQL avec Docker (recommandé)

```bash
docker compose up -d postgres
```

Le service expose PostgreSQL 16 sur `localhost:5432`, identifiants de développement
`postgres / postgres`, base `afriland`. Les données persistent dans le volume
`afriland_pg_data`. Vérifier l'état avec `docker compose ps`.

### 3.2 SQLite (sans Docker)

Renseigner dans `backend-api/.env` :

```env
DATABASE_URL=sqlite:///./aflang.db
```

Le moteur est choisi automatiquement d'après `DATABASE_URL` (`backend-api/core/database.py`) ;
la recherche plein texte s'appuie alors sur FTS5.

## 4. Backend (FastAPI)

### 4.1 Environnement virtuel et dépendances

```powershell
# Windows PowerShell
cd backend-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

```bash
# Linux / macOS
cd backend-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Configuration

```powershell
copy .env.example .env    # Windows
```

```bash
cp .env.example .env      # Linux / macOS
```

Variables du backend (`backend-api/.env`, valeurs par défaut dans `core/config.py`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5432/afriland` | connexion à la base. Les formes `postgres://` et `postgresql://` sont normalisées automatiquement |
| `AUTH_SECRET_KEY` | `dev-change-me-in-production` | signature des jetons de session. Valeur aléatoire longue obligatoire en production |
| `AUTH_TOKEN_TTL_HOURS` | `24` | durée de vie d'un jeton |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | origines autorisées, séparées par des virgules |
| `CATALOG_STUB` | `false` | sert le catalogue depuis `catalog/stub.py` au lieu de la base |
| `CATALOG_AUTO_SEED` | `true` | insère un jeu de démonstration si l'index est vide. À passer à `false` en production |
| `CATALOG_BOOTSTRAP_INGEST` | `true` | ingestion initiale au démarrage, source par source, pour toute source encore vide |
| `AFRILANG_AUTO_SEED` | `true` | importe l'inventaire `Afrilang.pdf` au démarrage |
| `ACCOUNTS_STUB` | `false` | authentification bouchon, sans base |
| `ACCOUNTS_AUTO_SEED` | `true` | crée le compte admin initial si aucun admin n'existe |
| `ADMIN_SEED_EMAIL` | `admin@afriland.org` | e-mail de l'admin initial |
| `ADMIN_SEED_PASSWORD` | `admin123` | mot de passe de l'admin initial. À changer avant toute mise en ligne |
| `ADMIN_SEED_DISPLAY_NAME` | `Admin AfroLang` | nom affiché de l'admin initial |
| `LOG_LEVEL` | `INFO` | niveau de journalisation |
| `KAGGLE_USERNAME` | vide | identifiant Kaggle, optionnel — sans lui le connecteur Kaggle échoue, les autres sources continuent |
| `KAGGLE_KEY` | vide | clé d'API Kaggle, optionnelle |

Le fichier `.env` est ignoré par git : aucun secret réel ne doit figurer dans `.env.example`
ni dans la documentation.

### 4.3 Lancer l'API

```powershell
# Windows
.\.venv\Scripts\uvicorn main:app --reload --port 8000
```

```bash
# Linux / macOS, environnement virtuel activé
python -m uvicorn main:app --reload --port 8000
```

Points de contrôle :

- <http://127.0.0.1:8000/health> — service vivant
- <http://127.0.0.1:8000/health/db> — connexion base et tables présentes
- <http://127.0.0.1:8000/docs> — documentation OpenAPI interactive
- <http://127.0.0.1:8000/api/v1> — description de l'API publique

Au premier démarrage, l'application crée les tables, amorce le compte admin, importe
l'inventaire Afrilang, puis lance l'ingestion initiale en tâche de fond. Cette ingestion ne
bloque ni le démarrage ni le healthcheck ; une source restée vide est reprise au démarrage
suivant.

## 5. Frontend (Next.js)

```powershell
# Windows
cd frontend-app
copy .env.example .env.local
npm install
npm run dev
```

```bash
# Linux / macOS
cd frontend-app
cp .env.example .env.local
npm install
npm run dev
```

Application disponible sur <http://localhost:3000>.

Variables du frontend (`frontend-app/.env.local`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `API_URL` | `http://127.0.0.1:8000` en développement | URL du backend utilisée par le rendu serveur et par le proxy `/api-backend/*` |
| `NEXT_PUBLIC_API_URL` | non défini | URL du backend appelée directement depuis le navigateur. Si absente, le navigateur passe par le proxy `/api-backend` |
| `DEV_ALLOWED_ORIGINS` | vide | origines de développement supplémentaires (tunnel, machine virtuelle, IP du réseau local), séparées par des virgules |

En développement, laisser `NEXT_PUBLIC_API_URL` vide : le navigateur passe par le proxy Next.js,
ce qui évite toute question de CORS. En production, les deux services vivant sur des domaines
distincts, `API_URL` doit pointer vers l'URL publique du backend.

## 6. Comptes de démonstration

| Compte | Identifiants | Remarque |
| --- | --- | --- |
| Admin initial | `admin@afriland.org` / `admin123` | créé au démarrage si aucun admin n'existe, et promu super admin |

Le super admin ne peut être ni désactivé ni rétrogradé depuis la console ; son transfert passe
par une commande locale — voir [backend/compte-super-admin.md](./backend/compte-super-admin.md).

## 7. Peupler le catalogue

L'ingestion s'exécute au démarrage pour les sources encore vides. Elle se déclenche aussi à la
demande :

```bash
cd backend-api
python -m scheduler                          # ingestion Hugging Face + Kaggle
python -m scripts.import_afrilang_inventory  # import de l'inventaire Afrilang.pdf
```

`python -m scheduler` affiche, par source, le nombre d'ajouts, de retraits et les erreurs.
Aucune minuterie n'est embarquée dans l'application : l'ordonnancement périodique reste externe
(cron, phase 2).

## 8. Mettre à jour une base existante après un `git pull`

Le projet n'utilise pas d'outil de migration : `init_db()` crée les tables manquantes mais ne
modifie jamais une table existante. Quand un modèle gagne une colonne, une base créée avant
renvoie des erreurs 500 (`no such column: ...`). Rattrapage :

```bash
cd backend-api
python -m scripts.migrate_local_db
```

Le script est idempotent, traite SQLite comme PostgreSQL, et sauvegarde la base SQLite avant
modification. Détails et procédure d'ajout d'une colonne :
[backend/migration-base-locale.md](./backend/migration-base-locale.md).

## 9. Travailler sans base : les modes bouchon

Pour développer le frontend seul, sans PostgreSQL ni ingestion, dans `backend-api/.env` :

```env
CATALOG_STUB=true
CATALOG_AUTO_SEED=false
ACCOUNTS_STUB=true
```

Les routes catalogue répondent alors depuis `catalog/stub.py` et l'authentification depuis
`accounts/stub.py`, avec les mêmes contrats JSON que l'implémentation réelle. Voir
[contracts/README.md](./contracts/README.md).

## 10. Tests et vérifications

### Backend

```bash
cd backend-api
python -m pytest                          # suite complète
python -m pytest -m "not integration"     # sans les tests exigeant PostgreSQL
```

Les tests marqués `integration` (`tests/test_postgres.py`) supposent la base Docker démarrée.

### Frontend

```bash
cd frontend-app
npm test              # vitest
npx tsc --noEmit      # vérification des types
npx eslint .          # lint
```

## 11. Déploiement

Le déploiement de référence utilise Railway, un service par composant.

**Service backend** — commande de démarrage :

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variables à définir : `DATABASE_URL` (base PostgreSQL managée), `AUTH_SECRET_KEY` (valeur
aléatoire longue), `CORS_ORIGINS` (URL publique du frontend), `ADMIN_SEED_PASSWORD`,
`CATALOG_AUTO_SEED=false`, et les identifiants Kaggle si l'ingestion Kaggle est souhaitée.

**Service frontend** — `npm run build` puis `npm start`, avec `API_URL` pointant vers l'URL
publique du backend.

Vérifications après déploiement : `/health`, `/health/db`, puis une recherche depuis l'interface.

## 12. Dépannage

| Symptôme | Cause | Correctif |
| --- | --- | --- |
| Routes catalogue en 500, `no such column` | base locale antérieure à une story | `python -m scripts.migrate_local_db` (section 8) |
| `/health/db` en 503 | PostgreSQL arrêté ou `DATABASE_URL` erronée | `docker compose up -d postgres`, vérifier `.env` |
| Port 8000 ou 3000 déjà occupé | instance déjà lancée | changer de port (`--port 8010`, `npm run dev -- --port 3010`) ou arrêter l'instance |
| 403 « Unauthorized » sur `/_next/*` depuis une autre machine | origine de développement non autorisée | ajouter l'hôte à `DEV_ALLOWED_ORIGINS` |
| Ingestion Kaggle en échec, Hugging Face passe | `KAGGLE_USERNAME` / `KAGGLE_KEY` absents | renseigner les identifiants, ou ignorer : la source est reprise au démarrage suivant |
| Interface vide, compteurs bloqués sur « … » | backend injoignable depuis le navigateur | vérifier `API_URL` et que le backend répond sur `/health` |
| `npm run build` échoue sur une erreur de syntaxe dans une chaîne générée | chemin du projet contenant une apostrophe | déplacer le dépôt dans un chemin sans apostrophe ; en attendant, vérifier avec `npx tsc --noEmit`, `npx eslint .` et `npm test` |

## Voir aussi

- [fonctionnement.md](./fonctionnement.md) — fonctionnement global de la plateforme
- [architecture-backend.md](./architecture-backend.md) — architecture du backend
- [architecture/ARCHITECTURE-SPINE.md](./architecture/ARCHITECTURE-SPINE.md) — décisions d'architecture
- [contracts/README.md](./contracts/README.md) — contrats d'interface et modes bouchon
