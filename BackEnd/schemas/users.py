# schemas/users.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    PENDING = "pending"

class UserBase(BaseModel):
    email: EmailStr
    fname: str = Field(..., min_length=1)
    lname: str = Field(..., min_length=1)
    mname: Optional[str] = None
    sex: Optional[bool] = None
    dob: Optional[date] = None
    contact_number: Optional[str] = None
    picture: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.PENDING

class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    mname: Optional[str] = None
    sex: Optional[bool] = None
    dob: Optional[date] = None
    contact_number: Optional[str] = None
    picture: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    is_profile_complete: bool
    is_doctor_approved: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: int
    email: str
    fname: str
    lname: str
    mname: Optional[str] = None
    name: str
    role: UserRole
    picture: Optional[str] = None
    is_profile_complete: bool

    @validator('name', always=True)
    def generate_name(cls, v, values):
        fname = values.get('fname', '')
        lname = values.get('lname', '')
        mname = values.get('mname', '')
        
        if mname:
            return f"{fname} {mname} {lname}".strip()
        return f"{fname} {lname}".strip()

    class Config:
        from_attributes = True


