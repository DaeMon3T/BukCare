from pydantic import BaseModel, EmailStr, Field, validator, conint
from typing import Optional, List
from datetime import date, datetime


# ==========================
# 🔐 AUTHENTICATION SCHEMAS
# ==========================

class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    fname: str = Field(..., min_length=1, description="First name")
    lname: str = Field(..., min_length=1, description="Last name")
    mname: Optional[str] = Field(None, description="Middle name")
    contact_number: Optional[str] = Field(None, description="Contact number")
    dob: Optional[date] = Field(None, description="Date of birth")
    sex: Optional[str] = Field(None, description="Sex (M/F/Other)")

    class Config:
        title = "RegisterRequest (Authentication)"
        schema_extra = {"tag": "Authentication"}


class LoginRequest(BaseModel):
    """Traditional email/password login request"""
    email: EmailStr
    password: str

    class Config:
        title = "LoginRequest (Authentication)"
        schema_extra = {"tag": "Authentication"}


class CompleteProfileRequest(BaseModel):
    """Request to complete user profile after Google OAuth"""
    user_id: int = Field(..., description="User ID to update")
    sex: conint(ge=0, le=1) = Field(..., description="Sex (0 = Female, 1 = Male)")
    dob: date = Field(..., description="Date of birth")
    contact_number: str = Field(..., description="Contact number")
    address_id: Optional[int] = Field(None, description="Address ID")
    password: Optional[str] = Field(None, min_length=8, description="Optional password for email/password login")

    class Config:
        title = "CompleteProfileRequest (Authentication)"
        schema_extra = {"tag": "Authentication"}


class TokenResponse(BaseModel):
    """Complete authentication response with tokens and user info"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

    class Config:
        title = "TokenResponse (Authentication)"
        schema_extra = {
            "tag": "Authentication",
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "user_id": 1,
                    "email": "user@example.com",
                    "fname": "John",
                    "lname": "Doe",
                    "role": "PATIENT",
                    "is_verified": False
                }
            }
        }


class GoogleAuthRequest(BaseModel):
    """Request schema for Google OAuth authentication"""
    id_token: str = Field(..., description="Google ID token from OAuth flow")

    class Config:
        title = "GoogleAuthRequest (Authentication)"
        schema_extra = {"tag": "Authentication"}

class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str = Field(..., description="Valid refresh token")

    class Config:
        title = "RefreshTokenRequest (Authentication)"
        schema_extra = {"tag": "Authentication"}