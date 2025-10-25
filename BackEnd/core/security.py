# core/security.py

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

from core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS
SECRET_KEY = settings.JWT_SECRET_KEY
REFRESH_SECRET_KEY = settings.JWT_REFRESH_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

ACCESS_TOKEN_EXPIRE_SECONDS = ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_TOKEN_EXPIRE_SECONDS = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

# ----------------------
# Password functions
# ----------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash with proper error handling."""
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password with proper validation."""
    if not password:
        raise ValueError("Password cannot be empty")
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
    return pwd_context.hash(password)

# ----------------------
# JWT token creation
# ----------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create an access token with proper validation."""
    if not data or not isinstance(data, dict):
        raise ValueError("Token data must be a non-empty dictionary")
    
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    
    try:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        raise ValueError(f"Failed to create access token: {str(e)}")

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a refresh token with proper validation."""
    if not data or not isinstance(data, dict):
        raise ValueError("Token data must be a non-empty dictionary")
    
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        raise ValueError(f"Failed to create refresh token: {str(e)}")

# ----------------------
# JWT decoding
# ----------------------
def decode_token(token: str, is_refresh: bool = False) -> dict:
    secret = REFRESH_SECRET_KEY if is_refresh else SECRET_KEY
    return jwt.decode(token, secret, algorithms=[ALGORITHM])

def decode_access_token(token: str) -> dict:
    try:
        payload = decode_token(token, is_refresh=False)
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")

def verify_refresh_token(token: str) -> dict:
    """
    Verify the refresh token is valid and not expired.
    """
    try:
        payload = decode_token(token, is_refresh=True)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
