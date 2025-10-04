# schemas/doctors.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from schemas.address import Address


# ---------------------------
# Specialization Schemas
# ---------------------------
class SpecializationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    descriptions: Optional[str] = Field(None, max_length=500)

class SpecializationCreate(SpecializationBase):
    pass

class SpecializationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    descriptions: Optional[str] = Field(None, max_length=500)

class Specialization(SpecializationBase):
    model_config = ConfigDict(from_attributes=True)
    specialization_id: int


# ---------------------------
# Doctor Schemas
# ---------------------------
class DoctorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    specialization_id: Optional[int] = None
    address_id: Optional[int] = None

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=6, max_length=255)
    specialization_ids: Optional[List[int]] = []  # ✅ multiple specialization IDs


class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    specialization_ids: Optional[List[int]] = []  # ✅ allow multiple updates
    address_id: Optional[int] = None

class Doctor(DoctorBase):
    model_config = ConfigDict(from_attributes=True)
    doctor_id: int
    specializations: List[Specialization] = [] 
    # You can import Address schema separately if you want
    # or define it here as well if you want everything in one file
    address: Optional["Address"] = None
