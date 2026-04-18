from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from core.database import Base

class AuditActionType(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    SYSTEM = "SYSTEM"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # None if system action
    action = Column(SQLEnum(AuditActionType), nullable=False)
    entity_name = Column(String(100), nullable=False) # e.g 'Appointment', 'User'
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True) # JSON or text description
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User")
