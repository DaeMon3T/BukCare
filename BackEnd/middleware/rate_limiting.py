# middleware/rate_limiting.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
from typing import Dict, Tuple
from collections import defaultdict, deque
import asyncio

class RateLimiter:
    def __init__(self):
        # Store request timestamps for each IP+endpoint combination
        self.requests: Dict[str, deque] = defaultdict(lambda: deque())
        # Cleanup old entries periodically
        self.last_cleanup = time.time()
    
    def is_allowed(self, key: str, max_requests: int = 100, window_seconds: int = 3600) -> Tuple[bool, int]:
        """
        Check if key is within rate limit
        Returns: (is_allowed, remaining_requests)
        """
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
            return False, 0
        
        # Add current request
        key_requests.append(current_time)
        remaining = max_requests - len(key_requests)
        return True, remaining
    
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
global_rate_limiter = RateLimiter()
endpoint_rate_limiter = RateLimiter()  # Separate instance for endpoints

# Paths exempt from global rate limiting
GLOBAL_RATE_LIMIT_EXEMPT = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting middleware - 100 requests per hour per IP"""
    client_ip = request.client.host
    
    # Check global rate limit
    is_allowed, remaining = global_rate_limiter.is_allowed(
        f"global:{client_ip}", 
        max_requests=100, 
        window_seconds=3600
    )
    
    if not is_allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": True,
                "message": "Rate limit exceeded. Please try again later.",
                "status_code": 429,
                "retry_after": 3600
            }
        )
    
    # Continue with the request
    response = await call_next(request)
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    
    return response

# Specific rate limiters for different endpoints
class EndpointRateLimits:
    def __init__(self):
        self.limits = {
            "/v1/auth/signin": (10, 300),  # 10 requests per 5 minutes (increased from 5)
            "/v1/auth/signup": (5, 300),   # 5 requests per 5 minutes (increased from 3)
            "/v1/auth/refresh": (20, 60),  # 20 requests per minute (increased from 10)
            "/v1/auth/password-reset": (5, 300),  # 5 requests per 5 minutes (increased from 3)
        }
    
    def get_limit(self, path: str) -> Tuple[int, int]:
        """Get rate limit for specific endpoint"""
        return self.limits.get(path, None)  # Return None for non-limited endpoints

endpoint_limits = EndpointRateLimits()

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
    """Endpoint-specific rate limiting (only for sensitive endpoints)"""
    client_ip = request.client.host
    path = request.url.path
    
    # Only apply endpoint-specific limits to configured paths
    limit_config = endpoint_limits.get_limit(path)
    
    if limit_config:
        max_requests, window_seconds = limit_config
        
        # Use a separate key for endpoint-specific tracking
        is_allowed, remaining = endpoint_rate_limiter.is_allowed(
            f"endpoint:{client_ip}:{path}", 
            max_requests, 
            window_seconds
        )
        
        if not is_allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": True,
                    "message": f"Rate limit exceeded for {path}. Please try again later.",
                    "status_code": 429,
                    "retry_after": window_seconds
                }
            )
    
    response = await call_next(request)
    return response