# backend/schemas/schedules.py
from pydantic import BaseModel, Field
import datetime
from typing import Optional

class ScheduleBase(BaseModel):
    doctor_id: int = Field(..., description="Doctor's unique ID")
    date: datetime.date = Field(..., description="Date of availability")
    start_time: datetime.time = Field(..., description="Start time of availability")
    end_time: datetime.time = Field(..., description="End time of availability")
    is_available: bool = True
    notes: Optional[str] = None


class ScheduleCreate(ScheduleBase):
    """Schema for creating a schedule entry"""
    pass


class ScheduleResponse(ScheduleBase):
    id: int

    class Config:
        from_attributes = True  # replaces orm_mode=True in Pydantic v2
