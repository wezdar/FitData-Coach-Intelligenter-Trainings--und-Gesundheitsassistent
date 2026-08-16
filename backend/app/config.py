from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="FITDATA_", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+asyncpg://fitdata:fitdata@postgres:5432/fitdata"
    jwt_secret: str = Field(default="development-only-change-me", min_length=16)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    # The dev server picks the first free port from 3000 upward, so allow the
    # usual range instead of pinning a single origin.
    cors_origins: list[str] = [
        "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003",
        "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003",
    ]
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_raw_bucket: str = "fitdata-raw"


@lru_cache
def get_settings() -> Settings:
    return Settings()
