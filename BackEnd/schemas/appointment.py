# schemas/appointment.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date, time
from models.appointment import AppointmentStatus, AppointmentType

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    reason: str
    notes: Optional[str] = None
    appointment_type: AppointmentType = AppointmentType.ONLINE

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: datetime
    reason: str
    notes: Optional[str] = None
    patient_id: Optional[int] = None 
    appointment_type: Optional[AppointmentType] = AppointmentType.ONLINE

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    reason: Optional[str] = None
    status: AppointmentStatus
    appointment_type: AppointmentType
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    has_reviewed: bool = False

    class Config:
        from_attributes = True

class Appointment(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    status: AppointmentStatus

class AppointmentSchema(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    appointment_date: datetime
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True 

class RescheduleRequest(BaseModel):
    new_date: date
    new_time: time
    reason: str