# API admin comptes — AfroLang-Library (Story 4.2)

> Gouverné par FR-20, AD-14. Gestion des comptes — réservée au rôle **Admin**.

**Base URL** : `http://127.0.0.1:8000/accounts/admin/accounts`  
**Auth** : `Authorization: Bearer <jeton>` (compte Admin uniquement)

Contrat parent : [accounts-api.md](./accounts-api.md)

---

## Endpoints

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/accounts/admin/accounts` | Liste tous les comptes |
| GET | `/accounts/admin/accounts/{id}` | Fiche d'un compte |
| POST | `/accounts/admin/accounts` | Créer un compte (rôle assignable) |
| PATCH | `/accounts/admin/accounts/{id}` | Modifier rôle, nom ou désactiver |

---

## Autorisations (AD-14)

| Rôle | Accès |
| --- | --- |
| Admin | CRUD gestion des comptes |
| Chercheur | **403** |
| Non authentifié | **401** |

Un compte **désactivé** (`is_active: false`) :
- ne peut plus se connecter (**403** à la connexion) ;
- les sessions existantes sont invalidées ;
- ne peut plus contribuer (token refusé).

---

## Création (POST)

```json
{
  "email": "aicha@university.org",
  "password": "password123",
  "display_name": "Aïcha Diallo",
  "role": "chercheur"
}
```

Rôles : `chercheur` (défaut) ou `admin`.

---

## Mise à jour (PATCH)

```json
{
  "role": "admin",
  "is_active": false
}
```

Champs optionnels : `display_name`, `role`, `is_active`.

Un admin ne peut pas désactiver **son propre** compte (**400**).

---

## Exemples

```powershell
$token = (curl -X POST http://127.0.0.1:8000/accounts/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@afriland.org","password":"admin123"}' | ConvertFrom-Json).access_token

curl http://127.0.0.1:8000/accounts/admin/accounts -H "Authorization: Bearer $token"
```

---

## Bouchon

Avec `ACCOUNTS_STUB=true`, CRUD en mémoire sur les comptes factices + comptes créés via l'API.

---

## Erreurs

| Code | Cas |
| --- | --- |
| 400 | Auto-désactivation interdite |
| 401 | Jeton absent ou invalide |
| 403 | Rôle non Admin, ou compte désactivé à la connexion |
| 404 | Compte introuvable |
| 409 | E-mail déjà utilisé |
