# schemas/users.py
from pydantic import BaseModel, EmailStr, Field, conint
from typing import Optional
from datetime import datetime
from enum import Enum


# Match the roles in your model
class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    STAFF = "staff"
    PATIENT = "patient"


# ========================
# Base Schema
# ========================
class UserBase(BaseModel):
    fname: str = Field(..., example="Juan")
    lname: str = Field(..., example="Dela Cruz")
    mname: Optional[str] = Field(None, example="Santos")
    email: EmailStr
    contact_number: Optional[str] = None
    sex: Optional[conint(ge=0, le=1)] = Field(
        None, description="1 = Male, 0 = Female", example=1
    )
    dob: Optional[datetime] = None
    role: Optional[UserRole] = UserRole.PATIENT


# ========================
# Create Schema (Signup)
# ========================
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


# ========================
# OAuth2 Signup Schema
# ========================
class UserOAuthCreate(UserBase):
    google_id: str
    password: Optional[str] = None  # optional, user may add password later


# ========================
# Update Schema
# ========================
class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    mname: Optional[str] = None
    contact_number: Optional[str] = None
    sex: Optional[conint(ge=0, le=1)] = Field(
        None, description="1 = Male, 0 = Female"
    )
    dob: Optional[datetime] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


# ========================
# Response Schema
# ========================
class UserResponse(UserBase):
    user_id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True  # ✅ works with SQLAlchemy ORM
