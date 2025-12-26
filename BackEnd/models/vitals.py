from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    
    heart_rate = Column(Integer, nullable=True) # bpm
    weight = Column(Float, nullable=True)       # kg
    blood_pressure = Column(String, nullable=True) # e.g. "120/80"
    sleep_hours = Column(Float, nullable=True)  # hours
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    patient = relationship("User", back_populates="vitals")