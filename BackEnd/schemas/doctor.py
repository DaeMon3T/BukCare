# schemas/doctor.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from schemas.specialization import Specialization
from schemas.address import Address

class DoctorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    specialization_id: Optional[int] = None
    address_id: Optional[int] = None

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=6, max_length=255)

class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    specialization_id: Optional[int] = None
    address_id: Optional[int] = None

class Doctor(DoctorBase):
    model_config = ConfigDict(from_attributes=True)
    doctor_id: int
    specialization: Optional[Specialization] = None
    address: Optional[Address] = None