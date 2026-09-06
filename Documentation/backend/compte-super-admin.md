# Le compte super admin

## Le problème

Avant cet ajout, la gestion des comptes ne protégeait qu'un seul cas : un admin ne pouvait pas
désactiver **son propre** compte. Rien n'empêchait un admin d'en désactiver un autre. Le compte
d'administration initial pouvait donc être neutralisé par n'importe quel autre admin, sans recours
depuis l'interface — il fallait rouvrir la base à la main pour le réactiver.

## Pourquoi un drapeau et non un rôle

La première idée — reconnaître le super admin à son e-mail (`admin_seed_email`) — ne tient pas :
le jour où le titulaire change d'adresse, la comparaison ne correspond plus et la protection
disparaît en silence. L'ancre doit être portée par la ligne du compte, pas par une de ses données
modifiables.

La deuxième idée — ajouter `super_admin` à l'énumération `AccountRole` — pose deux problèmes :

1. `role` est un champ **modifiable depuis une liste déroulante** de la console admin. Placer la
   protection dans un champ éditable la met à un changement de valeur de disparaître, ce qui est
   exactement la faille que l'on ferme.
2. Chaque contrôle `role == "admin"` du backend et du frontend devrait devenir
   `role in (admin, super_admin)`. En oublier un revient soit à priver le super admin de la
   console, soit à laisser un contrôle passer.

D'où le choix retenu : une colonne booléenne `account.is_super_admin`, **orthogonale au rôle**. Le
super admin garde `role = admin`, tous les contrôles existants continuent de fonctionner sans
retouche, et le drapeau n'apparaît dans aucun schéma de requête — il n'est donc modifiable par
aucun appel HTTP.

## Les règles

| Action | Auteur | Résultat |
| --- | --- | --- |
| Désactiver le super admin | un autre admin | **403** |
| Changer le rôle du super admin | un autre admin | **403** |
| Se rétrograder soi-même | le super admin | **403** |
| Se désactiver soi-même | le super admin | **400** (règle générale préexistante) |
| Modifier son nom, son e-mail, son mot de passe | le super admin | autorisé |
| Positionner `is_super_admin` via l'API | n'importe qui | champ ignoré, jamais lu |

Le super admin reste libre de modifier ses propres informations : la protection tient au drapeau
porté par la ligne, pas à ses coordonnées. C'était l'objectif de départ.

Il y a **au plus un** super admin par instance. `AccountsRepository.promote_super_admin` retire le
drapeau au détenteur précédent dans la même transaction ; l'ancien titulaire reste admin ordinaire
et actif.

## Où sont les garde-fous

| Fichier | Rôle |
| --- | --- |
| `core/models.py` | colonne `Account.is_super_admin` |
| `accounts/admin_account_service.py` | refus 403 sur désactivation et changement de rôle |
| `accounts/stub.py` | **mêmes règles** en mode bouchon |
| `accounts/repository.py` | `get_super_admin`, `promote_super_admin` |
| `accounts/seed.py` | amorçage et rattrapage des bases existantes |
| `accounts/api_schemas.py` | `is_super_admin` en réponse seulement |

Le bouchon mérite une mention : `admin_update_account` de `accounts/stub.py` est un chemin
d'écriture **indépendant** du service. Une protection posée uniquement dans le service
disparaîtrait dès que `ACCOUNTS_STUB=true`. Les deux chemins portent donc la même règle, et les
tests couvrent les deux.

## Amorçage

Au démarrage, `seed_admin_if_missing` juge l'existence d'un super admin sur le drapeau, jamais sur
`admin_seed_email` :

- un super admin existe : rien à faire ;
- aucun super admin, **exactement un** compte admin : cet admin est promu (rattrapage d'une base
  antérieure à la colonne) ;
- aucun super admin, **plusieurs** admins : rien n'est fait. Désigner arbitrairement le premier
  serait un choix silencieux et lourd de conséquences ; l'opérateur tranche avec le script
  ci-dessous ;
- aucun admin du tout : le compte `admin_seed_email` est créé avec le drapeau.

## Désigner ou transférer le super admin

Le transfert passe par une commande locale, **pas par une route**. Un endpoint de transfert
rouvrirait la faille que le drapeau ferme : un admin compromis se transférerait le statut, puis
désactiverait l'ancien titulaire. Une commande locale suppose un accès à la machine et à la base.

```bash
cd backend-api
./.venv/Scripts/python.exe -m scripts.set_super_admin --show          # Windows
python -m scripts.set_super_admin --show                             # Linux / macOS

python -m scripts.set_super_admin nouvelle.adresse@exemple.org
```

Le compte visé est promu au rôle admin et réactivé si besoin. Sortie attendue :

```
Ancien super admin : bernard@google.com (reste admin ordinaire)
Nouveau super admin : admin@afriland.org (id=1)
```

Avant de transférer, assurez-vous de pouvoir vous connecter au compte cible : aucune route ne peut
plus le désactiver, mais aucune ne peut non plus réinitialiser son mot de passe.

## Migration d'une base existante

La colonne est déclarée dans `ADDED_COLUMNS` de `scripts/migrate_local_db.py`, qui traite
désormais SQLite **et** Postgres :

```bash
cd backend-api
python -m scripts.migrate_local_db
```

L'ajout est purement additif (`ALTER TABLE account ADD COLUMN is_super_admin BOOLEAN NOT NULL
DEFAULT FALSE`). Sur SQLite le script sauvegarde la base au préalable ; sur Postgres il ne le fait
pas — la copie relève de l'outillage de la base. Voir
[migration-base-locale.md](./migration-base-locale.md).

Après la migration, l'appel `init_db()` déclenche le rattrapage décrit plus haut.

## Console admin

La ligne du super admin porte l'étiquette `super admin` ; sa liste déroulante de rôle et son bouton
`Désactiver` sont désactivés (`components/admin/AccountAdminPanel.tsx`). L'interface se contente de
ne pas proposer une action que le serveur refuserait : l'application de la règle reste côté
backend.

## Tests

| Fichier | Couverture |
| --- | --- |
| `backend-api/tests/test_admin_accounts.py` | refus 403 par un autre admin, refus d'auto-rétrogradation, protection conservée après changement de coordonnées, drapeau non assignable via l'API, unicité du titulaire, refus en mode bouchon |
| `frontend-app/test/admin/AccountAdminPanel.test.tsx` | commandes verrouillées sur la ligne du super admin |
