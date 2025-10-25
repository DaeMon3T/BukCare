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
        try:
            if hasattr(self, 'CORS_ALLOWED_ORIGINS') and self.CORS_ALLOWED_ORIGINS:
                return json.loads(self.CORS_ALLOWED_ORIGINS)
            else:
                return ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
        except (json.JSONDecodeError, AttributeError):
            # Fallback to default if JSON parsing fails
            return ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
    
    @property
    def allowed_hosts_list(self) -> list:
        """Convert ALLOWED_HOSTS JSON string to list"""
        import json
        try:
            return json.loads(self.ALLOWED_HOSTS)
        except (json.JSONDecodeError, AttributeError):
            # Fallback to default if JSON parsing fails
            return ["localhost", "127.0.0.1"]
    
    @property
    def allowed_extensions_list(self) -> list:
        """Convert ALLOWED_EXTENSIONS string to list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    def create_log_directory(self):
        """Create log directory if it doesn't exist"""
        log_path = Path(self.LOG_FILE).parent
        log_path.mkdir(parents=True, exist_ok=True)


# Initialize settings with validation
try:
    settings = Settings()
    # Create necessary directories
    settings.create_log_directory()
except Exception as e:
    import logging
    logging.error(f"Failed to initialize settings: {str(e)}")
    # Provide default settings for development
    class DefaultSettings:
        def __init__(self):
            self.DATABASE_URL = "postgresql://user:password@localhost:5432/bukcare"
            self.JWT_SECRET_KEY = "your-secret-key-here"
            self.JWT_REFRESH_SECRET_KEY = "your-refresh-secret-key-here"
            self.GOOGLE_CLIENT_ID = "your-google-client-id"
            self.GOOGLE_CLIENT_SECRET = "your-google-client-secret"
            self.OAUTH_REDIRECT_URI = "http://localhost:8000/api/v1/auth/google/callback"
            self.CLOUDINARY_CLOUD_NAME = "your-cloudinary-name"
            self.CLOUDINARY_API_KEY = "your-cloudinary-key"
            self.CLOUDINARY_API_SECRET = "your-cloudinary-secret"
            self.EMAIL_HOST_USER = "your-email@example.com"
            self.EMAIL_HOST_PASSWORD = "your-email-password"
            self.DEFAULT_FROM_EMAIL = "noreply@bukcare.com"
            self.CORS_ALLOWED_ORIGINS = '["http://localhost:3000", "http://localhost:5173"]'
            self.ALLOWED_HOSTS = '["localhost", "127.0.0.1"]'
            self.FRONTEND_URL = "http://localhost:5173"
        
        def allowed_origins_list(self):
            return ["http://localhost:3000", "http://localhost:5173"]
        
        def allowed_hosts_list(self):
            return ["localhost", "127.0.0.1"]
        
        def allowed_extensions_list(self):
            return ["jpg", "jpeg", "png", "pdf"]
        
        def create_log_directory(self):
            pass
    
    settings = DefaultSettings()
    print("Warning: Using default settings. Please configure your environment variables.")