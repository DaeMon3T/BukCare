from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class Patient(Base):
    __tablename__ = "patients"
    
    patient_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    address = relationship("Address", back_populates="patients")