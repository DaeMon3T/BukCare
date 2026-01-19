from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships and shii
    doctor = relationship("User", foreign_keys=[doctor_id], backref="received_reviews")
    patient = relationship("User", foreign_keys=[patient_id], backref="written_reviews")
    
    appointment = relationship("Appointment", backref="review")