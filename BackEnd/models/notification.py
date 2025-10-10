# models/notification.py
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, index=True)
    source_user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    target_user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    status = Column(Boolean, default=False, nullable=False)  # False=Unread, True=Read
    
    # Relationships
    source_user = relationship("User", foreign_keys=[source_user_id], back_populates="notifications_sent")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="notifications_received")
    appointment = relationship("Appointment", back_populates="notifications")
