from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os
import json
import logging

# ==============================
# Environment Auto-Detection
# ==============================

# Get environment type (default: development)
ENV = os.getenv("ENV", "development")

# Automatically load correct .env file
if ENV == "production":
    load_dotenv(".env.production")
else:
    load_dotenv(".env.development")

# ==============================
# Settings Class
# ==============================

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432

    # ==============================
    # Admin account
    # ==============================
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    ADMIN_FIRST_NAME: str = "Admin"
    ADMIN_LAST_NAME: str = "User"


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

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

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
    DEBUG: bool = ENV != "production"  # Automatically disables debug in production
    API_V1_PREFIX: str = "/v1"

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,pdf"

    # Security
    PASSWORD_MIN_LENGTH: int = 8

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # Logging
    LOG_LEVEL: str = "DEBUG" if ENV != "production" else "INFO"
    LOG_FILE: str = f"logs/{ENV}/bukcare.log"

    model_config = ConfigDict(
        env_file=".env.production" if ENV == "production" else ".env.development",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ==============================
    # Helper Properties
    # ==============================

    @property
    def allowed_origins_list(self) -> list:
        """Convert CORS_ALLOWED_ORIGINS JSON string to list"""
        try:
            return json.loads(self.CORS_ALLOWED_ORIGINS)
        except (json.JSONDecodeError, AttributeError):
            return [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://bukcare.com"
            ]

    @property
    def allowed_hosts_list(self) -> list:
        """Convert ALLOWED_HOSTS JSON string to list"""
        try:
            return json.loads(self.ALLOWED_HOSTS)
        except (json.JSONDecodeError, AttributeError):
            return ["localhost", "127.0.0.1", "bukcare.com"]

    @property
    def allowed_extensions_list(self) -> list:
        """Convert ALLOWED_EXTENSIONS string to list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    def create_log_directory(self):
        """Create log directory if it doesn't exist"""
        log_path = Path(self.LOG_FILE).parent
        log_path.mkdir(parents=True, exist_ok=True)


# ==============================
# Initialize Settings
# ==============================
try:
    settings = Settings()
    settings.create_log_directory()
    logging.basicConfig(
        filename=settings.LOG_FILE,
        level=settings.LOG_LEVEL,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    logging.info(f"✅ Loaded settings for environment: {ENV}")
except Exception as e:
    logging.error(f"⚠️ Failed to initialize settings: {e}")
    raise e
