# models/doctor.py
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Doctor(Base):
    __tablename__ = "doctors"
    
    doctor_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    specialization_id = Column(Integer, ForeignKey("specializations.specialization_id"), nullable=True)
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    
    # Relationships
    specialization = relationship("Specialization", back_populates="doctors")
    #address = relationship("Address", back_populates="doctors")
    #appointments = relationship("Appointment", back_populates="doctor")