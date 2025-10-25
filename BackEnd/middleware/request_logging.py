# middleware/request_logging.py
from fastapi import Request
from fastapi.responses import Response
import time
import uuid
from core.logging_config import get_logger

logger = get_logger(__name__)

async def request_logging_middleware(request: Request, call_next):
    """Log all API requests and responses"""
    
    # Generate request ID
    request_id = str(uuid.uuid4())
    
    # Start timing
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    logger.info(
        f"Request completed: {request.method} {request.url.path} - {response.status_code}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": process_time,
            "response_size": response.headers.get("content-length", 0),
        }
    )
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response
