from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AfroLang-Library API"
    debug: bool = False
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/afriland"
    log_level: str = "INFO"
    catalog_stub: bool = False
    catalog_auto_seed: bool = True
    accounts_stub: bool = False
    accounts_auto_seed: bool = True
    admin_seed_email: str = "admin@afriland.org"
    admin_seed_password: str = "admin123"
    admin_seed_display_name: str = "Admin AfroLang"
    auth_secret_key: str = "dev-change-me-in-production"
    auth_token_ttl_hours: int = 24
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    kaggle_username: str | None = None
    kaggle_key: str | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg2://", 1)
        if value.startswith("postgresql://") and "+psycopg" not in value:
            return value.replace("postgresql://", "postgresql+psycopg2://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
