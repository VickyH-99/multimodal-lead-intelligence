"""Application settings and environment configuration."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings loaded from environment variables."""

    app_name: str = "Multimodal Lead Intelligence Agent Platform"
    api_prefix: str = "/api"
    debug: bool = False
    database_url: str = "sqlite:///./lead_intelligence.db"
    frontend_origin: str = "http://localhost:5173"
    demo_seed_on_startup: bool = True
    similar_case_limit: int = 3
    default_human_capacity: int = 18
    default_ai_capacity: int = 40
    strategy_s_threshold: float = 0.85
    strategy_a_threshold: float = 0.72
    strategy_b_threshold: float = 0.58
    strategy_c_threshold: float = 0.42
    log_level: str = Field(default="INFO")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("debug", mode="before")
    @classmethod
    def coerce_debug_flag(cls, value: object) -> bool:
        """Treat nonstandard environment debug strings as disabled by default."""

        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", ""}:
                return False
        return bool(value)


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
