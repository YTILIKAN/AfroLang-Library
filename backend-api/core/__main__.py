"""Commande : python -m core"""

from core.database import init_db
from core.logging import get_logger, setup_logging


def main() -> None:
    setup_logging()
    logger = get_logger(__name__)
    try:
        init_db()
    except Exception:
        logger.exception("Échec init_db")
        raise
    logger.info("init_db terminé avec succès.")


if __name__ == "__main__":
    main()
