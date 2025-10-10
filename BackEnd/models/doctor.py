# models/doctor.py
from sqlalchemy import Column, String, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from core.database import Base

# Association table for many-to-many relationship
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
    
    # Many-to-Many: Specialization can belong to multiple doctors
    doctors = relationship("Doctor", secondary=doctor_specializations, back_populates="specializations")

class Doctor(Base):
    __tablename__ = "doctors"
    
    doctor_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, unique=True)
    specialization_id = Column(Integer, ForeignKey("specializations.specialization_id"), nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)  # ✅ ADD THIS LINE
    license_number = Column(String(100), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    address = relationship("Address", back_populates="doctors")

    # Many-to-Many: Doctor can have multiple specializations
    specializations = relationship("Specialization", secondary=doctor_specializations, back_populates="doctors")