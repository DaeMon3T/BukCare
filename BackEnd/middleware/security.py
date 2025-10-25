# middleware/security.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
import hashlib
import hmac
from typing import Optional
import re

class SecurityMiddleware:
    def __init__(self):
        self.blocked_ips = set()
        self.suspicious_ips = {}
        self.max_failed_attempts = 5
        self.block_duration = 3600  # 1 hour
    
    def is_suspicious_request(self, request: Request) -> bool:
        """Check if request appears suspicious"""
        # Check for common attack patterns
        suspicious_patterns = [
            r'<script.*?>.*?</script>',  # XSS
            r'union.*select',  # SQL injection
            r'<iframe.*?>',  # iframe injection
            r'javascript:',  # JavaScript injection
            r'vbscript:',  # VBScript injection
            r'onload=',  # Event handler injection
            r'onerror=',  # Event handler
        ]
        
        # Check URL path
        path = request.url.path.lower()
        for pattern in suspicious_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        
        # Check query parameters
        for param_name, param_value in request.query_params.items():
            param_value_lower = param_value.lower()
            for pattern in suspicious_patterns:
                if re.search(pattern, param_value_lower, re.IGNORECASE):
                    return True
        
        return False
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is currently blocked"""
        if ip in self.blocked_ips:
            return True
        return False
    
    def block_ip(self, ip: str, reason: str = "Suspicious activity"):
        """Block an IP address"""
        self.blocked_ips.add(ip)
        # In a real application, you'd want to persist this to a database
    
    def record_failed_attempt(self, ip: str):
        """Record a failed authentication attempt"""
        current_time = time.time()
        
        if ip not in self.suspicious_ips:
            self.suspicious_ips[ip] = {
                'attempts': 0,
                'first_attempt': current_time,
                'last_attempt': current_time
            }
        
        self.suspicious_ips[ip]['attempts'] += 1
        self.suspicious_ips[ip]['last_attempt'] = current_time
        
        # Block IP if too many failed attempts
        if self.suspicious_ips[ip]['attempts'] >= self.max_failed_attempts:
            self.block_ip(ip, "Too many failed authentication attempts")
    
    def reset_failed_attempts(self, ip: str):
        """Reset failed attempts for an IP"""
        if ip in self.suspicious_ips:
            del self.suspicious_ips[ip]

security_middleware = SecurityMiddleware()

# async def security_middleware_handler(request: Request, call_next):
#     """Security middleware to detect and prevent attacks"""
#     client_ip = request.client.host
    
#     # Check if IP is blocked
#     if security_middleware.is_ip_blocked(client_ip):
#         return JSONResponse(
#             status_code=status.HTTP_403_FORBIDDEN,
#             content={
#                 "error": True,
#                 "message": "Access denied",
#                 "status_code": 403
#             }
#         )
    
#     # Check for suspicious requests
#     if security_middleware.is_suspicious_request(request):
#         security_middleware.block_ip(client_ip, "Suspicious request pattern")
#         return JSONResponse(
#             status_code=status.HTTP_403_FORBIDDEN,
#             content={
#                 "error": True,
#                 "message": "Request blocked due to security concerns",
#                 "status_code": 403
#             }
#         )
    
#     # Add security headers
#     response = await call_next(request)
    
#     # Add security headers
#     response.headers["X-Content-Type-Options"] = "nosniff"
#     response.headers["X-Frame-Options"] = "DENY"
#     response.headers["X-XSS-Protection"] = "1; mode=block"
#     response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#     response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
#     response.headers["Content-Security-Policy"] = "default-src 'self'"
    
#     return response

async def security_middleware_handler(request: Request, call_next):
    """Security middleware to detect and prevent attacks"""

    # Skip docs and OpenAPI paths
    if request.url.path.startswith("/docs") or request.url.path.startswith("/redoc") or request.url.path.startswith("/openapi.json"):
        return await call_next(request)

    client_ip = request.client.host
    
    # Check if IP is blocked
    if security_middleware.is_ip_blocked(client_ip):
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "Access denied", "status_code": 403}
        )
    
    # Check for suspicious requests
    if security_middleware.is_suspicious_request(request):
        security_middleware.block_ip(client_ip, "Suspicious request pattern")
        return JSONResponse(
            status_code=403,
            content={"error": True, "message": "Request blocked due to security concerns", "status_code": 403}
        )
    
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response


def generate_csrf_token(user_id: int, secret_key: str) -> str:
    """Generate CSRF token"""
    timestamp = str(int(time.time()))
    message = f"{user_id}:{timestamp}"
    token = hmac.new(
        secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{token}:{timestamp}"

def verify_csrf_token(token: str, user_id: int, secret_key: str, max_age: int = 3600) -> bool:
    """Verify CSRF token"""
    try:
        token_part, timestamp_part = token.split(":")
        timestamp = int(timestamp_part)
        
        # Check if token is expired
        if time.time() - timestamp > max_age:
            return False
        
        # Verify token
        message = f"{user_id}:{timestamp_part}"
        expected_token = hmac.new(
            secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(token_part, expected_token)
    except (ValueError, TypeError):
        return False

def sanitize_input(input_string: str) -> str:
    """Sanitize user input"""
    if not isinstance(input_string, str):
        return ""
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', input_string)
    
    # Limit length
    if len(sanitized) > 1000:
        sanitized = sanitized[:1000]
    
    return sanitized.strip()
