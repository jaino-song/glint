"""
Worker Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Gemini API
    gemini_api_key: str

    # Redis (Upstash)
    redis_url: str = ""

    # Worker settings
    worker_api_key: str = ""
    poll_interval_seconds: int = 5
    max_concurrent_jobs: int = 3
    temp_storage_path: str = "/tmp/glint"

    # Sentry (optional)
    sentry_dsn: str = ""

    # YouTube Rate Limit Mitigation (optional, recommended for production)
    # Format: "webshare:username:password" for Webshare rotating proxy
    # Or: "http://user:pass@host:port" for standard HTTP proxy
    youtube_proxy_url: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
