# models/specialization.py
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from core.database import Base

class Specialization(Base):
    __tablename__ = "specializations"
    
    specialization_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    descriptions = Column(String(500), nullable=True)
    
    # Relationships
    doctors = relationship("Doctor", back_populates="specialization")
