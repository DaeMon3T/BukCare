# core/logging_config.py
import logging
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
        
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry["ip_address"] = record.ip_address
        
        return json.dumps(log_entry)

class LineLimitedRotatingFileHandler(logging.Handler):
    """Rotate logs when line count exceeds a limit"""
    def __init__(self, filename, max_lines=1000, backup_count=5, formatter=None):
        super().__init__()
        self.filename = Path(filename)
        self.max_lines = max_lines
        self.backup_count = backup_count
        self.formatter = formatter or logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        self.filename.parent.mkdir(exist_ok=True)
        self.filename.touch(exist_ok=True)

    def emit(self, record):
        log_entry = self.format(record)
        with self.filename.open("a", encoding="utf-8") as f:
            f.write(log_entry + "\n")
        self._rotate_if_needed()

    def _rotate_if_needed(self):
        with self.filename.open("r", encoding="utf-8") as f:
            lines = f.readlines()
        if len(lines) > self.max_lines:
            for i in reversed(range(1, self.backup_count)):
                old = self.filename.with_suffix(f".{i}")
                new = self.filename.with_suffix(f".{i+1}")
                if old.exists():
                    old.rename(new)
            self.filename.rename(self.filename.with_suffix(".1"))
            self.filename.touch()

    def format(self, record):
        return self.formatter.format(record)

def setup_logging():
    """Setup logging with line-based rotation"""
    
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    root_logger.addHandler(console_handler)
    
    # General log
    file_handler = LineLimitedRotatingFileHandler("logs/bukcare.log", max_lines=1000, backup_count=5)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    root_logger.addHandler(file_handler)
    
    # Structured JSON log
    json_handler = LineLimitedRotatingFileHandler("logs/bukcare_structured.log", max_lines=1000, backup_count=5, formatter=JSONFormatter())
    root_logger.addHandler(json_handler)
    
    # Error log
    error_handler = LineLimitedRotatingFileHandler("logs/bukcare_errors.log", max_lines=1000, backup_count=3, formatter=JSONFormatter())
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)
    
    # Security log
    security_handler = LineLimitedRotatingFileHandler("logs/bukcare_security.log", max_lines=1000, backup_count=3, formatter=JSONFormatter())
    security_handler.setLevel(logging.WARNING)
    root_logger.addHandler(security_handler)
    
    # Specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return root_logger

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

def log_user_action(logger: logging.Logger, user_id: int, action: str, details: dict = None):
    extra = {"user_id": user_id, "action": action, "details": details or {}}
    logger.info(f"User action: {action}", extra=extra)

def log_security_event(logger: logging.Logger, event: str, user_id: int = None, ip_address: str = None, details: dict = None):
    extra = {"security_event": event, "user_id": user_id, "ip_address": ip_address, "details": details or {}}
    logger.warning(f"Security event: {event}", extra=extra)

def log_api_request(logger: logging.Logger, method: str, path: str, user_id: int = None, ip_address: str = None, status_code: int = None):
    extra = {"request_method": method, "request_path": path, "user_id": user_id, "ip_address": ip_address, "status_code": status_code}
    logger.info(f"API request: {method} {path}", extra=extra)
