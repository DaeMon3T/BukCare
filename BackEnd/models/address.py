# models/address.py
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from core.database import Base

class Address(Base):
    __tablename__ = "addresses"
    
    address_id = Column(Integer, primary_key=True, index=True)
    street = Column(String(255), nullable=False)
    barangay = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    province = Column(String(100), nullable=False)
    zip_code = Column(String(10), nullable=True)
    country = Column(String(50), nullable=False, default="Philippines")
    
    # Relationships
    users = relationship("User", back_populates="address")
    doctors = relationship("Doctor", back_populates="address")
