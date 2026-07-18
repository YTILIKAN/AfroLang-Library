# API `accounts` — AfroLang-Library (Story 3.1)

> Gouverné par FR-16, FR-17, FR-18, FR-19, FR-20, AD-10, AD-14. Surface d'écriture authentifiée, séparée de l'API publique `catalog`.

**Base URL (local)** : `http://127.0.0.1:8000/accounts`  
**OpenAPI** : http://127.0.0.1:8000/docs (tag `accounts`)

---

## Principes

| Règle | Détail |
| --- | --- |
| Consultation publique | Recherche et API `/api/v1` restent **sans compte** (AD-10) |
| Écriture authentifiée | Contribution, gestion et admin passent par `accounts` |
| Rôles | `chercheur` (défaut) et `admin` (FR-16, AD-14) |
| Auth provisoire | Jetons Bearer en session serveur (MVP local) — Auth.js/NextAuth côté frontend à trancher |
| Bouchon | `ACCOUNTS_STUB=true` pour développer le frontend sans base |

---

## Authentification (implémentée — Story 3.1)

### Créer un compte

```http
POST /accounts/auth/register
Content-Type: application/json

{
  "email": "kofi@example.com",
  "password": "password123",
  "display_name": "Kofi Mensah"
}
```

Réponse `201` :

```json
{
  "id": 1,
  "email": "kofi@example.com",
  "display_name": "Kofi Mensah",
  "role": "chercheur",
  "is_active": true,
  "created_at": "2026-07-18T12:00:00+00:00"
}
```

### Se connecter

```http
POST /accounts/auth/login
Content-Type: application/json

{
  "email": "kofi@example.com",
  "password": "password123"
}
```

Réponse `200` :

```json
{
  "access_token": "<jeton>",
  "token_type": "bearer",
  "expires_at": "2026-07-19T12:00:00+00:00",
  "account": { "...": "..." }
}
```

Utiliser ensuite : `Authorization: Bearer <jeton>`

### Profil et déconnexion

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/accounts/me` | Bearer | Profil du compte courant |
| POST | `/accounts/auth/logout` | Bearer | Invalide le jeton |

---

## Contribution et gestion (contrat + bouchon)

Endpoints documentés pour le frontend ; implémentation complète en Stories 3.2–3.3 (contribution) et 4.x (admin).

| Méthode | Chemin | Rôle | Story | Statut |
| --- | --- | --- | --- | --- |
| POST | `/accounts/datasets` | Chercheur | 3.2 | Bouchon / 501 |
| GET | `/accounts/datasets/mine` | Chercheur | 3.3 | Bouchon / 501 |
| PATCH | `/accounts/datasets/{id}` | Chercheur (propriétaire) | 3.3 | Bouchon / 501 |
| DELETE | `/accounts/datasets/{id}` | Chercheur (propriétaire) | 3.3 | Bouchon / 501 |
| GET | `/accounts/admin/accounts` | Admin | 4.2 | Bouchon / partiel |

### Soumission (corps de requête — Story 3.2)

```json
{
  "title": "Twi Speech Samples",
  "source_url": "https://huggingface.co/datasets/kofi/twi-speech",
  "language": "twi",
  "task": "asr",
  "description": "Corpus vocal twi",
  "license_name": "CC BY 4.0",
  "data_format": "audio",
  "size": "500 MB"
}
```

---

## Bouchon (`ACCOUNTS_STUB=true`)

Comptes préconfigurés :

| E-mail | Mot de passe | Rôle |
| --- | --- | --- |
| `kofi@example.com` | `password123` | chercheur |
| `admin@afriland.org` | `admin123` | admin |

```powershell
$env:ACCOUNTS_STUB="true"
cd backend-api
.\.venv\Scripts\uvicorn main:app --reload --port 8000

# Login bouchon
curl -X POST http://127.0.0.1:8000/accounts/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"kofi@example.com","password":"password123"}'
```

---

## Entité partagée `Account` (AD-12)

Définie dans `backend-api/core/models.py` :

- `email`, `display_name`, `role`, `is_active`
- Lien optionnel `Dataset.contributor_account_id` pour la provenance (Stories 3.2+)

Sessions d'authentification : table privée `account_session` dans `accounts/models.py`.

---

## Erreurs courantes

| Code | Cas |
| --- | --- |
| 401 | Jeton absent, invalide ou expiré |
| 403 | Compte désactivé ou rôle insuffisant |
| 409 | E-mail déjà utilisé à l'inscription |
| 501 | Endpoint hors bouchon, pas encore implémenté |
