# models/address.py
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Province(Base):
    __tablename__ = "provinces"
    
    province_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    
    # Relationships

    cities = relationship("CityMunicipality", back_populates="province")

class CityMunicipality(Base):
    __tablename__ = "city_municipality"
    
    city_municipality_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    zip_code = Column(String(10), nullable=True)
    province_id = Column(Integer, ForeignKey("provinces.province_id"), nullable=False)
    
    # Relationships
    province = relationship("Province", back_populates="cities")
    addresses = relationship("Address", back_populates="city_municipality")

class Address(Base):
    __tablename__ = "addresses"
    
    address_id = Column(Integer, primary_key=True, index=True)
    street = Column(String(255), nullable=False)
    barangay = Column(String(100), nullable=False)
    city_municipality_id = Column(Integer, ForeignKey("city_municipality.city_municipality_id"), nullable=False)
    
    # Relationships
    city_municipality = relationship("CityMunicipality", back_populates="addresses")
    users = relationship("User", back_populates="address")
    doctors = relationship("Doctor", back_populates="address")