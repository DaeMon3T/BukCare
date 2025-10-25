# middleware/rate_limiting.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
from typing import Dict, Tuple
from collections import defaultdict, deque
import asyncio

class RateLimiter:
    def __init__(self):
        # Store request timestamps for each IP
        self.requests: Dict[str, deque] = defaultdict(lambda: deque())
        # Cleanup old entries periodically
        self.last_cleanup = time.time()
    
    def is_allowed(self, ip: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """Check if IP is within rate limit"""
        current_time = time.time()
        
        # Clean up old entries every 5 minutes
        if current_time - self.last_cleanup > 300:
            self._cleanup_old_entries(current_time, window_seconds)
            self.last_cleanup = current_time
        
        # Get requests for this IP
        ip_requests = self.requests[ip]
        
        # Remove requests outside the window
        cutoff_time = current_time - window_seconds
        while ip_requests and ip_requests[0] < cutoff_time:
            ip_requests.popleft()
        
        # Check if under limit
        if len(ip_requests) >= max_requests:
            return False
        
        # Add current request
        ip_requests.append(current_time)
        return True
    
    def _cleanup_old_entries(self, current_time: float, window_seconds: int):
        """Remove old entries to prevent memory leaks"""
        cutoff_time = current_time - window_seconds
        for ip in list(self.requests.keys()):
            ip_requests = self.requests[ip]
            while ip_requests and ip_requests[0] < cutoff_time:
                ip_requests.popleft()
            
            # Remove empty entries
            if not ip_requests:
                del self.requests[ip]

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    # Get client IP
    client_ip = request.client.host
    
    # Check rate limit (100 requests per hour by default)
    if not rate_limiter.is_allowed(client_ip, max_requests=100, window_seconds=3600):
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
            "/api/v1/auth/signin": (5, 300),  # 5 requests per 5 minutes
            "/api/v1/auth/signup": (3, 300),  # 3 requests per 5 minutes
            "/api/v1/auth/refresh": (10, 60),  # 10 requests per minute
            "/api/v1/auth/password-reset": (3, 300),  # 3 requests per 5 minutes
        }
    
    def get_limit(self, path: str) -> Tuple[int, int]:
        """Get rate limit for specific endpoint"""
        return self.limits.get(path, (100, 3600))  # Default: 100 requests per hour

endpoint_limiter = EndpointRateLimiter()

async def endpoint_rate_limit_middleware(request: Request, call_next):
    """Endpoint-specific rate limiting"""
    client_ip = request.client.host
    path = request.url.path
    
    max_requests, window_seconds = endpoint_limiter.get_limit(path)
    
    if not rate_limiter.is_allowed(client_ip, max_requests, window_seconds):
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
