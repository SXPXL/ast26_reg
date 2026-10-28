import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Athra Fest Portal API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Auth toggle switch: when False, authentication checks are bypassed
    REQ_AUTH: bool = True

    # Security
    SECRET_KEY: str = "replace_this_with_a_super_secret_jwt_key_fest_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/athra_fest_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/athra_fest_db"

    # Cashfree PG
    CASHFREE_APP_ID: str = "TEST_CASHFREE_APP_ID"
    CASHFREE_SECRET_KEY: str = "TEST_CASHFREE_SECRET_KEY"
    CASHFREE_API_VERSION: str = "2023-08-01"
    CASHFREE_ENVIRONMENT: str = "SANDBOX"  # SANDBOX or PRODUCTION
    CASHFREE_RETURN_URL: str = "http://localhost:5173/payment/status?order_id={order_id}"
    CASHFREE_NOTIFY_URL: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
