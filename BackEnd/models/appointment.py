from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Enum, String
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    EXPIRED = "expired"
    # New: For walk-ins
    IN_PROGRESS = "in_progress" 

class AppointmentType(str, enum.Enum):
    ONLINE = "online"
    WALK_IN = "walk_in"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    appointment_date = Column(DateTime, nullable=False)
    reason = Column(String, nullable=True)  # Added for appointment booking
    status = Column(Enum(AppointmentStatus, name="appointment_status_enum", values_callable=lambda obj: [e.value for e in obj]), default=AppointmentStatus.PENDING, nullable=False)
    appointment_type = Column(Enum(AppointmentType, name="appointment_type_enum", values_callable=lambda obj: [e.value for e in obj]), default=AppointmentType.ONLINE, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_as_patient")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="appointments_as_doctor")
    notifications = relationship("Notification", back_populates="appointment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Appointment(id={self.id}, patient_id={self.patient_id}, doctor_id={self.doctor_id}, status={self.status})>"
