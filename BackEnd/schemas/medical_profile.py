from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

# 1. Base Schema (Shared properties)
class MedicalProfileBase(BaseModel):
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    philhealth_number: Optional[str] = None
    pwd_id_number: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None

# 2. Input Schema (What we receive from the Frontend)
class MedicalProfileUpdate(MedicalProfileBase):
    pass  # Used when a user/doctor updates the profile

# 3. Output Schema (What we send to the Frontend)
class MedicalProfileOut(MedicalProfileBase):
    id: int
    user_id: int
    medical_uid: UUID4  # <--- The Critical QR Code ID
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True # Use 'orm_mode = True' if you are on Pydantic v1