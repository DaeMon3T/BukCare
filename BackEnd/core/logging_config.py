# core/logging_config.py
import logging
import logging.handlers
import os
from pathlib import Path
from datetime import datetime
import json

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry["ip_address"] = record.ip_address
        
        return json.dumps(log_entry)

def setup_logging():
    """Setup comprehensive logging configuration"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler for general logs
    file_handler = logging.handlers.RotatingFileHandler(
        "logs/bukcare.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # JSON file handler for structured logs
    json_handler = logging.handlers.RotatingFileHandler(
        "logs/bukcare_structured.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    json_handler.setLevel(logging.INFO)
    json_formatter = JSONFormatter()
    json_handler.setFormatter(json_formatter)
    root_logger.addHandler(json_handler)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        "logs/bukcare_errors.log",
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(json_formatter)
    root_logger.addHandler(error_handler)
    
    # Security log handler
    security_handler = logging.handlers.RotatingFileHandler(
        "logs/bukcare_security.log",
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    security_handler.setLevel(logging.WARNING)
    security_handler.setFormatter(json_formatter)
    root_logger.addHandler(security_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return root_logger

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)

def log_user_action(logger: logging.Logger, user_id: int, action: str, details: dict = None):
    """Log user actions with structured data"""
    extra = {
        "user_id": user_id,
        "action": action,
        "details": details or {}
    }
    logger.info(f"User action: {action}", extra=extra)

def log_security_event(logger: logging.Logger, event: str, user_id: int = None, ip_address: str = None, details: dict = None):
    """Log security events"""
    extra = {
        "security_event": event,
        "user_id": user_id,
        "ip_address": ip_address,
        "details": details or {}
    }
    logger.warning(f"Security event: {event}", extra=extra)

def log_api_request(logger: logging.Logger, method: str, path: str, user_id: int = None, ip_address: str = None, status_code: int = None):
    """Log API requests"""
    extra = {
        "request_method": method,
        "request_path": path,
        "user_id": user_id,
        "ip_address": ip_address,
        "status_code": status_code
    }
    logger.info(f"API request: {method} {path}", extra=extra)
