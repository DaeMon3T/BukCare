from sqlalchemy import Column, String, Integer, ForeignKey, Table, Boolean, Time, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


# ───────────────────────────────
# Many-to-Many: Doctor ↔ Specialization
# ───────────────────────────────
doctor_specializations = Table(
    "doctor_specializations",
    Base.metadata,
    Column("doctor_id", Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), primary_key=True),
    Column("specialization_id", Integer, ForeignKey("specializations.specialization_id", ondelete="CASCADE"), primary_key=True),
)


# ───────────────────────────────
# Specialization
# ───────────────────────────────
class Specialization(Base):
    __tablename__ = "specializations"

    specialization_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    descriptions = Column(String(500), nullable=True)

    # Relationships
    doctors = relationship("Doctor", secondary=doctor_specializations, back_populates="specializations")

    def __repr__(self):
        return f"<Specialization(id={self.specialization_id}, name='{self.name}')>"


# ───────────────────────────────
# Doctor
# ───────────────────────────────
class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Address hierarchy (linked to location tables)
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="SET NULL"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    barangay_id = Column(Integer, ForeignKey("barangays.id", ondelete="SET NULL"), nullable=True)

    # License and documents
    prc_license_front = Column(String, nullable=True)
    prc_license_back = Column(String, nullable=True)
    prc_license_selfie = Column(String, nullable=True)

    license_number = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)

    is_verified = Column(Boolean, default=False)  # admin approval
    specializations_json = Column(Text, nullable=True)
    
    # Additional doctor information
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Integer, nullable=True)  # in cents
    is_accepting_patients = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (string references prevent circular imports)
    user = relationship("User", back_populates="doctor_profile")
    province = relationship("Province")
    city = relationship("City")
    barangay = relationship("Barangay")

    specializations = relationship("Specialization", secondary=doctor_specializations, back_populates="doctors")
    availabilities = relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan")

    def __repr__(self):
        return (
            f"<Doctor(id={self.doctor_id}, user_id={self.user_id}, "
            f"barangay_id={self.barangay_id}, city_id={self.city_id}, province_id={self.province_id})>"
        )


# ───────────────────────────────
# Doctor Availability
# ───────────────────────────────
class DoctorAvailability(Base):
    __tablename__ = "doctor_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    
    # Date-based availability (for specific dates)
    date = Column(DateTime, nullable=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    # Weekly availability (for recurring schedules)
    day_of_week = Column(String(10), nullable=True)  # e.g., "Monday"
    is_active = Column(Boolean, default=True)

    doctor = relationship("Doctor", back_populates="availabilities")

    def __repr__(self):
        return f"<DoctorAvailability(doctor_id={self.doctor_id}, day={self.day_of_week})>"
