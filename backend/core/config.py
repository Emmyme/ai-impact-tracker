import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./data/sustainability.db"
    database_type: str = "sqlite"
    
    # Server
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"
    environment: str = "development"
    
    # Energy calculation (for local training)
    energy_provider: str = "local"
    region: str = "local"
    
    # Development settings
    debug: bool = False
    log_level: str = "info"
    
    # Authentication & Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # PostgreSQL settings
    postgres_host: Optional[str] = None
    postgres_port: Optional[int] = None
    postgres_db: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    
    # MySQL settings
    mysql_host: Optional[str] = None
    mysql_port: Optional[int] = None
    mysql_db: Optional[str] = None
    mysql_user: Optional[str] = None
    mysql_password: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()
