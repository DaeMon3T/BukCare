from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    source_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_user = relationship("User", foreign_keys=[source_user_id], back_populates="notifications_sent")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="notifications_received")
    appointment = relationship("Appointment", back_populates="notifications")
