from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VitalUpdate(BaseModel):
    heart_rate: Optional[int] = None
    weight: Optional[float] = None
    blood_pressure: Optional[str] = None
    sleep_hours: Optional[float] = None

class VitalResponse(VitalUpdate):
    updated_at: datetime