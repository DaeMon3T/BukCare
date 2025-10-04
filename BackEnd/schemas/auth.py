from pydantic import BaseModel, EmailStr, Field, validator,conint
from typing import Optional, List
from datetime import date, datetime


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


class LoginRequest(BaseModel):
    """Traditional email/password login request"""
    email: EmailStr
    password: str


class CompleteProfileRequest(BaseModel):
    """Request to complete user profile after Google OAuth"""
    user_id: int = Field(..., description="User ID to update")
    sex: conint(ge=0, le=1) = Field(..., description="Sex (0 = Female, 1 = Male)")
    dob: date = Field(..., description="Date of birth")
    contact_number: str = Field(..., description="Contact number")
    address_id: Optional[int] = Field(None, description="Address ID")
    password: Optional[str] = Field(None, min_length=8, description="Optional password for email/password login")
    
    


class TokenResponse(BaseModel):
    """Complete authentication response with tokens and user info"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

    class Config:
        json_schema_extra = {
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


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str = Field(..., description="Valid refresh token")


class PasswordResetRequest(BaseModel):
    """Request to reset password"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token"""
    token: str = Field(..., description="Password reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")


class ChangePasswordRequest(BaseModel):
    """Change password for authenticated user"""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @validator('new_password')
    def passwords_different(cls, v, values):
        if 'old_password' in values and v == values['old_password']:
            raise ValueError('New password must be different from old password')
        return v


class GoogleAuthRequest(BaseModel):
    """Request schema for Google OAuth authentication"""
    id_token: str = Field(..., description="Google ID token from OAuth flow")


class UserResponse(BaseModel):
    """User information response"""
    user_id: int
    email: EmailStr
    fname: str
    lname: str
    mname: Optional[str] = None
    role: str
    is_verified: bool
    is_active: bool
    contact_number: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    """JWT token payload data"""
    user_id: int
    email: EmailStr
    role: str
    exp: datetime
    type: str  # "access" or "refresh"


class EmailVerificationRequest(BaseModel):
    """Request to verify email"""
    token: str = Field(..., description="Email verification token")


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email"""
    email: EmailStr

class DoctorSignupRequest(BaseModel):
    invite_token: str
    fname: str
    lname: str
    mname: Optional[str] = None
    email: EmailStr
    phone: str
    license_number: str = Field(..., alias="licenseNumber")  # Accept both
    password: str
    specialization: List[str]
    other_specialization: Optional[str] = Field(None, alias="otherSpecialization")  # Accept both
    
    class Config:
        populate_by_name = True  # ✅ This allows both snake_case and camelCase