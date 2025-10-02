from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_LIFETIME_MINUTES: int = 60
    JWT_REFRESH_TOKEN_LIFETIME_DAYS: int = 7
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    OAUTH_REDIRECT_URI: str
    
    # Email Configuration
    EMAIL_HOST_USER: str
    EMAIL_HOST_PASSWORD: str
    DEFAULT_FROM_EMAIL: str
    
    # CORS Configuration
    CORS_ALLOWED_ORIGINS: str
    
    # Security
    ALLOWED_HOSTS: str
    
    # Frontend URL
    FRONTEND_URL: str
    
    # Domain Configuration
    DOMAIN: str = "bukcare.com"
    DEV_DOMAIN: str = "localhost:5173"
    
    # Application
    APP_NAME: str = "BukCare"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,pdf"
    
    # Security
    PASSWORD_MIN_LENGTH: int = 8
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/bukcare.log"
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra fields from .env
    )
    
    @property
    def allowed_origins_list(self) -> list:
        """Convert CORS_ALLOWED_ORIGINS JSON string to list"""
        import json
        return json.loads(self.CORS_ALLOWED_ORIGINS)
    
    @property
    def allowed_hosts_list(self) -> list:
        """Convert ALLOWED_HOSTS JSON string to list"""
        import json
        return json.loads(self.ALLOWED_HOSTS)
    
    @property
    def allowed_extensions_list(self) -> list:
        """Convert ALLOWED_EXTENSIONS string to list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    def create_log_directory(self):
        """Create log directory if it doesn't exist"""
        log_path = Path(self.LOG_FILE).parent
        log_path.mkdir(parents=True, exist_ok=True)


# Initialize settings
settings = Settings()

# Create necessary directories
settings.create_log_directory()