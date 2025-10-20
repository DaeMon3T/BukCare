from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    email = Column(String, unique=True, index=True, nullable=False)
    fname = Column(String, nullable=False)
    mname = Column(String, nullable=True)
    lname = Column(String, nullable=False)
    sex = Column(Boolean, nullable=True)
    dob = Column(DateTime, nullable=True)
    contact_number = Column(String, nullable=True)

    google_id = Column(String, unique=True, nullable=True)
    picture = Column(String, nullable=True)

    password = Column(String, nullable=True)

    role = Column(Enum(UserRole, name="user_role_enum"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_profile_complete = Column(Boolean, default=False)

    refresh_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # 🟦 Location references
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="SET NULL"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    barangay_id = Column(Integer, ForeignKey("barangays.id", ondelete="SET NULL"), nullable=True)

    province = relationship("Province")
    city = relationship("City")
    barangay = relationship("Barangay")

    appointments_as_patient = relationship(
        "Appointment",
        back_populates="patient",
        foreign_keys="Appointment.patient_id"
    )
    appointments_as_doctor = relationship(
        "Appointment",
        back_populates="doctor",
        foreign_keys="Appointment.doctor_id"
    )

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)

    notifications_sent = relationship(
        "Notification",
        foreign_keys="Notification.source_user_id",
        back_populates="source_user"
    )
    notifications_received = relationship(
        "Notification",
        foreign_keys="Notification.target_user_id",
        back_populates="target_user"
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
