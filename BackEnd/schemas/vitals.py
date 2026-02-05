from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Base schema with shared fields
class VitalBase(BaseModel):
    heart_rate: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    temperature: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None

# Used for creating/logging new vitals (Input)
class VitalCreate(VitalBase):
    pass

# Para updating existing vitals (Input)
class VitalUpdate(VitalBase):
    pass

# Para send ug data back to the frontend (Output)
class VitalResponse(VitalBase):
    id: int
    patient_id: int
    bmi: Optional[float] = None 
    logged_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 