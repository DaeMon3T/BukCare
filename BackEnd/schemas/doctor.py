from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


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
    user_id: int
    province_id: Optional[int] = None
    city_id: Optional[int] = None
    barangay_id: Optional[int] = None
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[int] = None
    is_accepting_patients: bool = True


class DoctorCreate(DoctorBase):
    prc_license_front: Optional[str] = None
    prc_license_back: Optional[str] = None
    prc_license_selfie: Optional[str] = None
    specializations_json: Optional[str] = None


class DoctorUpdate(BaseModel):
    province_id: Optional[int] = None
    city_id: Optional[int] = None
    barangay_id: Optional[int] = None
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[int] = None
    is_accepting_patients: Optional[bool] = None
    prc_license_front: Optional[str] = None
    prc_license_back: Optional[str] = None
    prc_license_selfie: Optional[str] = None
    specializations_json: Optional[str] = None


class DoctorResponse(BaseModel):
    doctor_id: int
    user_id: int
    name: str
    email: str
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[int] = None
    is_accepting_patients: bool
    is_verified: bool
    specializations: List[Specialization] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Doctor(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    doctor_id: int
    user_id: int
    name: str
    email: str
    specialization: str
    address: str
    is_verified: bool
    specializations: List[Specialization] = []
    created_at: datetime
    updated_at: datetime
