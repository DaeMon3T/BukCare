# middleware/rate_limiting.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
from typing import Dict, Tuple
from collections import defaultdict, deque
import asyncio

class RateLimiter:
    def __init__(self):
        # Store request timestamps for each IP and path combination
        self.requests: Dict[str, deque] = defaultdict(lambda: deque())
        # Cleanup old entries periodically
        self.last_cleanup = time.time()
    
    def is_allowed(self, key: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """Check if key (IP or IP:path) is within rate limit"""
        current_time = time.time()
        
        # Clean up old entries every 5 minutes
        if current_time - self.last_cleanup > 300:
            self._cleanup_old_entries(current_time, window_seconds)
            self.last_cleanup = current_time
        
        # Get requests for this key
        key_requests = self.requests[key]
        
        # Remove requests outside the window
        cutoff_time = current_time - window_seconds
        while key_requests and key_requests[0] < cutoff_time:
            key_requests.popleft()
        
        # Check if under limit
        if len(key_requests) >= max_requests:
            return False
        
        # Add current request
        key_requests.append(current_time)
        return True
    
    def _cleanup_old_entries(self, current_time: float, window_seconds: int):
        """Remove old entries to prevent memory leaks"""
        cutoff_time = current_time - window_seconds
        for key in list(self.requests.keys()):
            key_requests = self.requests[key]
            while key_requests and key_requests[0] < cutoff_time:
                key_requests.popleft()
            
            # Remove empty entries
            if not key_requests:
                del self.requests[key]

# Global rate limiter instance
rate_limiter = RateLimiter()

# Paths exempt from global rate limiting
GLOBAL_RATE_LIMIT_EXEMPT = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting middleware - applies to all endpoints except exempted ones"""
    
    # Skip global rate limit for exempt paths
    if request.url.path in GLOBAL_RATE_LIMIT_EXEMPT:
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host
    
    # Check global rate limit (1000 requests per hour for general browsing)
    if not rate_limiter.is_allowed(f"global:{client_ip}", max_requests=1000, window_seconds=3600):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": True,
                "message": "Rate limit exceeded. Please try again later.",
                "status_code": 429
            }
        )
    
    # Continue with the request
    response = await call_next(request)
    return response

# Specific rate limiters for different endpoints
class EndpointRateLimiter:
    def __init__(self):
        self.limits = {
            "/v1/auth/signin": (20, 300),  # ✅ 20 requests per 5 minutes (increased from 5)
            "/v1/auth/signup": (10, 300),  # ✅ 10 requests per 5 minutes (increased from 3)
            "/v1/auth/refresh": (30, 60),  # ✅ 30 requests per minute (increased from 10)
            "/v1/auth/password-reset": (5, 300),  # 5 requests per 5 minutes
            "/v1/auth/verify-email": (10, 300),  # 10 requests per 5 minutes
        }
    
    def get_limit(self, path: str) -> Tuple[int, int] | None:
        """Get rate limit for specific endpoint. Returns None if no specific limit."""
        return self.limits.get(path)

endpoint_limiter = EndpointRateLimiter()

# Paths exempt from endpoint-specific rate limiting
ENDPOINT_RATE_LIMIT_EXEMPT = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/v1/auth/google/callback",  # ✅ Google callbacks should not be rate limited
    "/v1/auth/google/login",
}

async def endpoint_rate_limit_middleware(request: Request, call_next):
    """Endpoint-specific rate limiting - only applies to paths with defined limits"""
    
    # Skip exempt paths
    if request.url.path in ENDPOINT_RATE_LIMIT_EXEMPT:
        return await call_next(request)
    
    client_ip = request.client.host
    path = request.url.path
    
    # Get limit for this specific endpoint
    limit = endpoint_limiter.get_limit(path)
    
    # If no specific limit defined, skip endpoint rate limiting
    if limit is None:
        return await call_next(request)
    
    max_requests, window_seconds = limit
    
    # Use IP:path combination for endpoint-specific limiting
    key = f"endpoint:{client_ip}:{path}"
    
    if not rate_limiter.is_allowed(key, max_requests, window_seconds):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": True,
                "message": f"Too many attempts. Please try again in {window_seconds // 60} minutes.",
                "status_code": 429,
                "retry_after": window_seconds
            }
        )
    
    response = await call_next(request)
    return response