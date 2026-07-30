from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AfroLang-Library API"
    debug: bool = False
    database_url: str = "sqlite:///./aflang.db"
    log_level: str = "INFO"
    catalog_stub: bool = False
    catalog_auto_seed: bool = True
    accounts_stub: bool = False
    auth_secret_key: str = "dev-change-me-in-production"
    auth_token_ttl_hours: int = 24
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    kaggle_username: str | None = None
    kaggle_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
