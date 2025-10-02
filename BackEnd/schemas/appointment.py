# schemas/appointment.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from models.appointment import AppointmentStatus
from schemas.users import User
from schemas.doctor import Doctor

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None

class Appointment(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    appointment_id: int
    created_at: datetime
    updated_at: datetime
    status: AppointmentStatus
    patient: Optional[User] = None
    doctor: Optional[Doctor] = None