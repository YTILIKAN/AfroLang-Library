from fastapi import APIRouter, Depends
from sqlmodel import Session

from catalog.service import CatalogService
from core.database import get_session

router = APIRouter(prefix="/catalog", tags=["catalog"])


def get_catalog_service(session: Session = Depends(get_session)) -> CatalogService:
    return CatalogService(session)
