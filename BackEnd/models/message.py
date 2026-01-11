from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from core.database import Base

class MessageType(str, enum.Enum):
    TEXT = "text"
    APPOINTMENT_REMINDER = "appointment_reminder"

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True) 
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    is_delete = Column(Boolean, default=False)

    message_type = Column(String, default=MessageType.TEXT.value)
    
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    appointment = relationship("Appointment", foreign_keys=[appointment_id])