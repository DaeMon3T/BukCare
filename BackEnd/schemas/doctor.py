from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, time


# ---------------------------
# Availability Schema
# ---------------------------
class DoctorAvailability(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    date: Optional[datetime] = None
    start_time: time
    end_time: time
    is_available: bool


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
    # REMOVED: province_id, city_id, barangay_id (these are in User model)
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
    # REMOVED: province_id, city_id, barangay_id
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
    specialization: str
    address: str
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[int] = None
    is_accepting_patients: Optional[bool] = None
    is_verified: bool
    is_doctor_approved: bool
    availabilities: List[DoctorAvailability] = []
    avatar: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Doctor(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    doctor_id: int
    user_id: int
    name: str
    email: str
    specialization: str
    address: str
    avatar: Optional[str] = None
    is_verified: bool
    is_doctor_approved: bool
    is_accepting_patients: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 
    average_rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0