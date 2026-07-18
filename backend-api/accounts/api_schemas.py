from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from core.models import AccountRole


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
    datasets: list[dict]


class AdminAccountsResponse(BaseModel):
    total: int
    accounts: list[AccountResponse]


class MessageResponse(BaseModel):
    detail: str
