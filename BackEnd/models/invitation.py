# models/invitation.py
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timedelta


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    invited_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="pending")  # pending | accepted | expired
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=1))  # ✅ auto 1-day expiry

    # Link back to user who sent invite
    inviter = relationship("User", back_populates="sent_invitations")
