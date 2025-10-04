# models/doctor.py
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Specialization(Base):
    __tablename__ = "specializations"
    
    specialization_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    descriptions = Column(String(500), nullable=True)
    
    doctors = relationship("Doctor", back_populates="specialization")

class Doctor(Base):
    __tablename__ = "doctors"
    
    doctor_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    specialization_id = Column(Integer, ForeignKey("specializations.specialization_id"), nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)  # ✅ ADD THIS LINE
    license_number = Column(String(100), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    specialization = relationship("Specialization", back_populates="doctors")
    address = relationship("Address", back_populates="doctors")