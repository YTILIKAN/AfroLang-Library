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

## Compte super admin

Un compte porte le drapeau `is_super_admin` (présent en lecture dans toutes les réponses, jamais
accepté en écriture). Il n'existe **au plus qu'un** super admin par instance.

| Action | Auteur | Réponse |
| --- | --- | --- |
| `is_active: false` sur le super admin | un autre admin | **403** |
| `role` différent sur le super admin | un autre admin | **403** |
| `role` différent de `admin` sur soi | le super admin | **403** |
| `is_active: false` sur soi | le super admin | **400** |
| `display_name` sur soi | le super admin | **200** |

Le champ `is_super_admin` n'est présent dans aucun schéma de requête : l'envoyer dans un POST ou un
PATCH n'a aucun effet, le compte créé ou modifié garde `is_super_admin: false`. Le transfert se
fait hors API, par `python -m scripts.set_super_admin <email>`.

Détails et justification : [compte-super-admin.md](../backend/compte-super-admin.md)

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

Le compte super admin ne peut être ni désactivé ni rétrogradé par un autre admin (**403**).

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
| 403 | Désactivation ou changement de rôle du compte super admin |
| 404 | Compte introuvable |
| 409 | E-mail déjà utilisé |
