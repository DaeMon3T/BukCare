from sqlalchemy import Column, String, Integer, ForeignKey, Table, Boolean, Time, Text
from sqlalchemy.orm import relationship
from core.database import Base

# Many-to-Many association for specializations
doctor_specializations = Table(
    "doctor_specializations",
    Base.metadata,
    Column("doctor_id", Integer, ForeignKey("doctors.doctor_id"), primary_key=True),
    Column("specialization_id", Integer, ForeignKey("specializations.specialization_id"), primary_key=True),
)

class Specialization(Base):
    __tablename__ = "specializations"
    
    specialization_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    descriptions = Column(String(500), nullable=True)
    
    doctors = relationship("Doctor", secondary=doctor_specializations, back_populates="specializations")


class Doctor(Base):
    __tablename__ = "doctors"
    
    doctor_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # License verification uploads - match frontend field names
    prc_license_front = Column(String, nullable=True)
    prc_license_back = Column(String, nullable=True)
    prc_license_selfie = Column(String, nullable=True)

    license_number = Column(String, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    
    # Verification status
    is_verified = Column(Boolean, default=False)
    
    # Store specializations as JSON string (for custom specializations)
    specializations_json = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    address = relationship("Address", back_populates="doctors")
    specializations = relationship("Specialization", secondary=doctor_specializations, back_populates="doctors")
    availabilities = relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan")


class DoctorAvailability(Base):
    __tablename__ = "doctor_availabilities"

    availability_id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)

    day_of_week = Column(String(10), nullable=False)  # e.g., "Monday"
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)  # temporary block for vacation, etc.

    doctor = relationship("Doctor", back_populates="availabilities")