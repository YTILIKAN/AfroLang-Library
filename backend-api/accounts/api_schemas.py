from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from catalog.api_schemas import DatasetSummaryResponse
from core.models import AccountRole, Provenance


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AccountResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str
    role: AccountRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    account: AccountResponse


class SubmitDatasetRequest(BaseModel):
    """Corps de soumission — implémentation complète en Story 3.2."""

    title: str = Field(min_length=1, max_length=500)
    source_url: str = Field(min_length=1)
    language: str = Field(min_length=1, description="Code ISO 639-3 ou alias")
    task: str = Field(min_length=1, description="Code ou alias de tâche NLP")
    description: str | None = None
    license_name: str | None = None
    data_format: str | None = None
    size: str | None = None


class UpdateDatasetRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)


class MyDatasetsResponse(BaseModel):
    total: int
    datasets: list[DatasetSummaryResponse]


class AdminAccountsResponse(BaseModel):
    total: int
    accounts: list[AccountResponse]


class AdminAccountCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    role: AccountRole = AccountRole.CHERCHEUR


class AdminAccountUpdateRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    role: AccountRole | None = None
    is_active: bool | None = None


class AdminDatasetListResponse(BaseModel):
    total: int
    datasets: list[DatasetSummaryResponse]


class AdminDatasetCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    source_url: str = Field(min_length=1)
    language: str = Field(min_length=1)
    task: str = Field(min_length=1)
    external_id: str | None = None
    source_slug: str = "manual"
    source_name: str | None = None
    source_base_url: str | None = None
    language_raw: str | None = None
    description: str | None = None
    provenance: Provenance = Provenance.MANUEL
    data_format: str | None = None
    size: str | None = None
    license_name: str | None = None
    license_spdx_id: str | None = None
    license_url: str | None = None
    contributor_account_id: int | None = None
    published_at: datetime | None = None


class AdminDatasetUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    source_url: str | None = None
    language: str | None = None
    language_raw: str | None = None
    task: str | None = None
    description: str | None = None
    provenance: Provenance | None = None
    source_slug: str | None = None
    source_name: str | None = None
    data_format: str | None = None
    size: str | None = None
    license_name: str | None = None
    license_spdx_id: str | None = None
    license_url: str | None = None
    contributor_account_id: int | None = None


class MessageResponse(BaseModel):
    detail: str
