"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/table_order"
    APP_PORT: int = 8081
    LOG_LEVEL: str = "INFO"
    JWT_SECRET: str = "change-me-in-production"
    CIRCUIT_FAILURE_THRESHOLD: float = 0.5
    CIRCUIT_COOLDOWN_MS: int = 30000

    model_config = {"env_prefix": "", "case_sensitive": True}


settings = Settings()
