from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from core.database import Base

class MedicalProfile(Base):
    __tablename__ = "medical_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Link to User
    # ondelete="CASCADE" is for wiping all data when the user delete their account
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # ---------------------------------------------------------
    # SECURITY FEATURE: The QR Code Identity
    # We use UUID because it is mathematically impossible to guess.
    # The QR Code will contain THIS value, not the integer 'id'.
    # ---------------------------------------------------------
    medical_uid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True, nullable=False)

    # ---------------------------------------------------------
    # The "Golden Record" (Doctor Verified Data)
    # ---------------------------------------------------------
    blood_type = Column(String(5), nullable=True)  # e.g., "O+"
    
    # Emergency Information
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_number = Column(String, nullable=True)
    
    # Identification Numbers (Encrypted or Protected in future)
    philhealth_number = Column(String, nullable=True)
    pwd_id_number = Column(String, nullable=True)

    # Clinical Summaries (Text fields for now, can be JSON later)
    # These are filled by the Doctor via the "Chart" component
    allergies = Column(Text, nullable=True)           # e.g., "Penicillin, Peanuts"
    chronic_conditions = Column(Text, nullable=True)  # e.g., "Hypertension, Asthma"
    current_medications = Column(Text, nullable=True) # e.g., "Losartan 50mg"

    # Meta
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to User
    user = relationship("User", back_populates="medical_profile")