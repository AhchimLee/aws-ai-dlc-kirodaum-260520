"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/table_order"
    APP_PORT: int = 8082
    LOG_LEVEL: str = "INFO"
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRY_HOURS: int = 16

    model_config = {"env_prefix": "", "case_sensitive": True}


settings = Settings()
