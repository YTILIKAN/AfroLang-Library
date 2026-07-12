# Contrat de connecteur de source (Story 1.3)

> Gouverné par AD-6, FR-1. Tout connecteur (Hugging Face, Kaggle, …) produit la **même structure intermédiaire** consommée par la normalisation.

## Signature commune

Classe abstraite : `ingestion.connectors.base.SourceConnector`

| Membre | Type | Description |
| --- | --- | --- |
| `source_slug` | `str` (property) | Identifiant stable de la source (`huggingface`, `kaggle`, …) |
| `fetch_raw_datasets()` | `() -> list[RawDatasetMetadata]` | Récupère les métadonnées brutes depuis l'API externe |
| `run()` | `() -> ConnectorFetchResult` | Point d'entrée standardisé avec encapsulation des erreurs (AD-13) |

### Exemple d'implémentation

```python
from ingestion.connectors import RawDatasetMetadata, SourceConnector


class HuggingFaceConnector(SourceConnector):
    @property
    def source_slug(self) -> str:
        return "huggingface"

    def fetch_raw_datasets(self) -> list[RawDatasetMetadata]:
        return [
            RawDatasetMetadata(
                external_id="org/dataset-name",
                title="Example Dataset",
                source_slug=self.source_slug,
                source_url="https://huggingface.co/datasets/org/dataset-name",
                language_raw=["Yorùbá", "yor"],
                task_tags_raw=["automatic-speech-recognition"],
                license_raw="cc-by-4.0",
            )
        ]
```

## Structure intermédiaire — `RawDatasetMetadata`

Schéma Pydantic : `ingestion.connectors.schemas.RawDatasetMetadata`

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `external_id` | `string` | oui | ID du dataset sur la plateforme |
| `title` | `string` | oui | Titre tel que renvoyé par la source |
| `source_slug` | `string` | oui | Slug de la source |
| `source_url` | `string` (URL) | oui | Lien de redirection — **jamais le contenu** |
| `language_raw` | `string \| string[] \| null` | non | Valeur(s) brute(s) de langue |
| `task_tags_raw` | `string[]` | non | Tags de tâche bruts |
| `description_raw` | `string \| null` | non | Description brute |
| `license_raw` | `string \| null` | non | Licence brute |
| `data_format_raw` | `string \| null` | non | Format brut (audio, text, …) |
| `size_raw` | `string \| null` | non | Taille brute |
| `published_at_raw` | `string \| null` | non | Date brute |

## Résultat d'exécution — `ConnectorFetchResult`

| Champ | Type | Description |
| --- | --- | --- |
| `source_slug` | `string` | Source exécutée |
| `fetched_at` | `datetime` (ISO 8601) | Horodatage |
| `datasets` | `RawDatasetMetadata[]` | Métadonnées récupérées |
| `errors` | `string[]` | Erreurs visibles (AD-13) — tableau vide si succès |

## Règles

1. Un connecteur **ne stocke pas** en base — il produit uniquement la structure intermédiaire.
2. Ajouter une source = ajouter une classe `SourceConnector`, sans modifier les autres connecteurs ni `catalog`.
3. Les erreurs sont **journalisées** via `ConnectorFetchResult.errors`, jamais avalées silencieusement.
