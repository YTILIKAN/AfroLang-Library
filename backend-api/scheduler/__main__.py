"""Commande : python -m scheduler — déclenche une ingestion complète à la demande (FR-2, AD-5)."""

from sqlmodel import Session

from core.database import get_engine, init_db
from core.logging import setup_logging
from ingestion import models as ingestion_models  # noqa: F401 — enregistre sync_log
from ingestion.connectors.huggingface import HuggingFaceConnector
from ingestion.connectors.kaggle import KaggleConnector
from ingestion.service import IngestionService


def main() -> None:
    setup_logging()
    init_db()

    connectors = [HuggingFaceConnector(), KaggleConnector()]

    with Session(get_engine()) as session:
        logs = IngestionService(session).run_all(connectors)

        for log in logs:
            status = "OK" if log.success else "ÉCHEC"
            summary = f"[{status}] {log.source_slug} — ajouts={log.added_count} retraits={log.removed_count}"
            if log.errors:
                summary += f" — erreurs: {log.errors}"
            print(summary)


if __name__ == "__main__":
    main()
