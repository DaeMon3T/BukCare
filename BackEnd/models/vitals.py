from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class PatientVital(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    
    # --- Heart Health ---
    heart_rate = Column(Integer, nullable=True)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    
    # --- Respiratory & Temp ---
    oxygen_saturation = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    
    # --- Body Composition ---
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)           
    bmi = Column(Float, nullable=True)
    
    # --- Timestamps ---
    logged_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    patient = relationship("User", back_populates="vitals")