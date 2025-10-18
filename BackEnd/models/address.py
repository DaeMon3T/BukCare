from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Province(Base):
    __tablename__ = "provinces"
    
    province_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    
    # Relationships
    cities = relationship("City", back_populates="province")

class City(Base):
    __tablename__ = "cities"
    
    city_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    province_id = Column(Integer, ForeignKey("provinces.province_id"), nullable=False)
    
    # Relationships
    province = relationship("Province", back_populates="cities")
    addresses = relationship("Address", back_populates="city")

class Address(Base):
    __tablename__ = "addresses"
    
    address_id = Column(Integer, primary_key=True, index=True)
    barangay = Column(String(100), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.city_id"), nullable=False)
    
    # Relationships
    city = relationship("City", back_populates="addresses")
    users = relationship("User", back_populates="address")
    doctors = relationship("Doctor", back_populates="address")
    patients = relationship("Patient", back_populates="address")