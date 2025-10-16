# models/appointment.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, func, Integer
from sqlalchemy.orm import relationship
from core.database import Base
import enum

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Appointment(Base):
    __tablename__ = "appointments"
    
    appointment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # ✅ Fixed: Foreign keys now correctly match User.id (integer)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    appointment_date = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus, name="appointmentstatus"), default=AppointmentStatus.PENDING, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    patient = relationship("User", back_populates="appointments_as_patient", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="appointments_as_doctor", foreign_keys=[doctor_id])
    
    notifications = relationship("Notification", back_populates="appointment")
