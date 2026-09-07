# API admin datasets — AfroLang-Library (Story 4.1)

> Gouverné par FR-19, AD-14. CRUD global sur l'index — réservé au rôle **Admin**.

**Base URL** : `http://127.0.0.1:8000/accounts/admin/datasets`  
**Auth** : `Authorization: Bearer <jeton>` (compte Admin uniquement)

Contrat parent : [accounts-api.md](./accounts-api.md)

---

## Endpoints

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/accounts/admin/datasets` | Liste **tous** les datasets de l'index |
| GET | `/accounts/admin/datasets/{id}` | Fiche détaillée |
| POST | `/accounts/admin/datasets` | Ajouter une référence |
| PATCH | `/accounts/admin/datasets/{id}` | Modifier une référence |
| DELETE | `/accounts/admin/datasets/{id}` | Supprimer une référence |

Réponses dataset : schéma `DatasetDetailResponse` / `DatasetSummaryResponse` (identique à l'API `catalog`).

---

## Autorisations (AD-14)

| Rôle | Accès |
| --- | --- |
| Admin | CRUD complet, toutes origines (`synchronisé`, `contribué`, `manuel`) |
| Chercheur | **403** sur tous les endpoints admin |
| Non authentifié | **401** |

---

## Création (POST)

```json
{
  "title": "Ghomala Text Corpus",
  "source_url": "https://example.org/datasets/ghomala-text",
  "language": "yor",
  "task": "classification",
  "provenance": "manuel",
  "source_slug": "manual",
  "description": "Référencement manuel par l'équipe",
  "data_format": "text"
}
```

Champs optionnels : `external_id`, `source_name`, `license_name`, `contributor_account_id`, etc.

---

## Exemples

```powershell
# Login admin
$token = (curl -X POST http://127.0.0.1:8000/accounts/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@afriland.org","password":"admin123"}' | ConvertFrom-Json).access_token

curl http://127.0.0.1:8000/accounts/admin/datasets -H "Authorization: Bearer $token"
```

---

## Bouchon

Avec `ACCOUNTS_STUB=true`, les endpoints admin datasets utilisent des données factices (3 datasets seed + CRUD en mémoire).

Implémentation réelle : persistance SQLite via `IngestionService` (écriture) et `CatalogService` (lecture).

---

## Erreurs

| Code | Cas |
| --- | --- |
| 401 | Jeton absent ou invalide |
| 403 | Rôle non Admin |
| 404 | Dataset introuvable |
| 422 | Langue ou tâche non reconnue |

Le `detail` d'un `422` sur la langue énonce le format attendu — un code ISO 639-3 de trois
lettres — et énumère les langues couvertes, celles-là mêmes que sert
`GET /api/v1/languages`. Un code de trois lettres hors index est accepté : la liste oriente
la saisie, elle ne la restreint pas.
