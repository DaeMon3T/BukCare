from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from core.database import Base

# ───────────────────────────────
# Province
# ───────────────────────────────
class Province(Base):
    __tablename__ = "provinces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    # Relationships
    cities = relationship(
        "City",
        back_populates="province",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Province(id={self.id}, name='{self.name}')>"


# ───────────────────────────────
# City / Municipality
# ───────────────────────────────
class City(Base):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint('name', 'province_id', name='uq_city_province'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    province = relationship("Province", back_populates="cities")
    barangays = relationship(
        "Barangay",
        back_populates="city",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<City(id={self.id}, name='{self.name}', province_id={self.province_id})>"


# ───────────────────────────────
# Barangay
# ───────────────────────────────
class Barangay(Base):
    __tablename__ = "barangays"
    __table_args__ = (
        UniqueConstraint('name', 'city_id', name='uq_barangay_city'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    city = relationship("City", back_populates="barangays")

    def __repr__(self):
        return f"<Barangay(id={self.id}, name='{self.name}', city_id={self.city_id})>"
