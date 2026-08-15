# Migrer sa base SQLite locale après un `git pull`

## Le problème

Au démarrage, l'application appelle `init_db()`, qui exécute `SQLModel.metadata.create_all`.
Cette fonction **crée les tables manquantes mais ne modifie jamais une table existante**. Quand une
story enrichit un modèle d'une nouvelle colonne, les bases créées avant cette story gardent
l'ancienne structure, et les requêtes échouent :

```
sqlite3.OperationalError: no such column: dataset.contributor_account_id
```

Le symptôme typique : toutes les routes `catalog` répondent 500 alors que les tests passent — les
tests utilisent une base neuve, votre base locale non.

Le projet n'a pas d'outil de migration (pas d'Alembic) : c'est une dette assumée tant que le
schéma bouge vite. Le script ci-dessous tient lieu de rattrapage.

## La solution

```bash
cd backend-api
./.venv/Scripts/python.exe -m scripts.migrate_local_db   # Windows
python -m scripts.migrate_local_db                       # Linux / macOS
```

Le script est idempotent — le relancer sans rien à faire ne coûte rien. Il :

1. sauvegarde la base (`aflang.db.bak-<horodatage>`, ignorée par git) ;
2. ajoute les colonnes manquantes listées dans `ADDED_COLUMNS` ;
3. appelle `init_db()` pour créer les tables absentes.

**Vos données sont conservées.** Ne supprimez pas `aflang.db` : elle contient les datasets
réellement ingérés depuis Hugging Face et Kaggle, qu'une réingestion complète mettrait longtemps à
reconstituer.

## Ajouter une colonne à la liste

Quand une story ajoute un champ à un modèle de `core/models.py`, complétez `ADDED_COLUMNS` dans
`backend-api/scripts/migrate_local_db.py` :

```python
ADDED_COLUMNS: list[tuple[str, str, str, str | None]] = [
    # (table, colonne, type SQL, index à créer ou None)
    ("dataset", "contributor_account_id", "INTEGER", "ix_dataset_contributor_account_id"),
]
```

Limite de SQLite : `ALTER TABLE ... ADD COLUMN` n'accepte pas de contrainte de clé étrangère sur
une table existante. La colonne est donc créée sans contrainte ; l'intégrité reste assurée par
l'ORM côté application. Pour un changement plus lourd (renommage, changement de type, contrainte
d'unicité), il faudra reconstruire la table — ou introduire enfin Alembic.

## Travailler sans base

Pour développer le frontend sans dépendre de l'état de la base, lancez le backend en mode bouchon :

```bash
CATALOG_STUB=true ./.venv/Scripts/python.exe -m uvicorn main:app --port 8000
```

Les routes `catalog` répondent alors depuis `catalog/stub.py`, avec trois datasets de démonstration.

## Historique

| Date | Colonne | Story |
|---|---|---|
| 2026-08-06 | `dataset.contributor_account_id` | 3.2 — contribution d'un dataset par un chercheur |
