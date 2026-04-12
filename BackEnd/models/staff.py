from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

# ───────────────────────────────
# Staff
# ───────────────────────────────
class Staff(Base):
    __tablename__ = "staffs"

    staff_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # License and documents
    proof_front = Column(String, nullable=True)
    proof_back = Column(String, nullable=True)
    proof_selfie = Column(String, nullable=True)

    # Additional staff information
    job_title = Column(String, nullable=True)
    
    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   
    # Relationships
    user = relationship("User", back_populates="staff_profile")

    def __repr__(self):
        return f"<Staff(id={self.staff_id}, user_id={self.user_id})>"
