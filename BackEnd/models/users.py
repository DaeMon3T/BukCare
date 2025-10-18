from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"


class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Basic user info
    email = Column(String, unique=True, index=True, nullable=False)
    fname = Column(String, nullable=False)
    mname = Column(String, nullable=True)
    lname = Column(String, nullable=False)
    sex = Column(Boolean, nullable=True)
    dob = Column(DateTime, nullable=True)
    contact_number = Column(String, nullable=True)
    
    # OAuth2 specific info
    google_id = Column(String, unique=True, nullable=True)
    picture = Column(String, nullable=True)
    
    # Authentication
    password = Column(String, nullable=True)
    
    # Account status
    role = Column(Enum(UserRole, name="user_role_enum"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_profile_complete = Column(Boolean, default=False)
    
    # Token management
    refresh_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Relationships
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    address = relationship("Address", back_populates="users")
    
    appointments_as_patient = relationship(
        "Appointment",
        back_populates="patient",
        foreign_keys="Appointment.patient_id"
    )
    appointments_as_doctor = relationship(
        "Appointment",
        back_populates="doctor",
        foreign_keys="Appointment.doctor_id"
    )
    
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    
    notifications_sent = relationship(
        "Notification",
        foreign_keys="Notification.source_user_id",
        back_populates="source_user"
    )
    notifications_received = relationship(
        "Notification",
        foreign_keys="Notification.target_user_id",
        back_populates="target_user"
    )
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # --- Helper for OAuth2 signup ---
    @classmethod
    def from_oauth(cls, data: dict):
        """Create a new user from Google OAuth data (role provided externally)."""
        role_value = data.get("role")
        role = UserRole(role_value) if role_value in UserRole._value2member_map_ else None

        return cls(
            google_id=data.get("google_id"),
            email=data.get("email"),
            fname=data.get("fname"),
            lname=data.get("lname"),
            picture=data.get("picture"),
            role=role,
            is_verified=data.get("email_verified", True),
            password=None,
            last_login=datetime.utcnow(),
        )

    def update_from_oauth(self, data: dict) -> bool:
        """Update existing user fields if changed. Returns True if updated."""
        updated = False

        if not self.google_id:
            self.google_id = data.get("google_id")
            updated = True

        for field in ["fname", "lname", "picture"]:
            new_value = data.get(field)
            if new_value and getattr(self, field) != new_value:
                setattr(self, field, new_value)
                updated = True

        # Update role if provided and changed
        if "role" in data and data["role"] in UserRole._value2member_map_:
            new_role = UserRole(data["role"])
            if self.role != new_role:
                self.role = new_role
                updated = True

        self.last_login = datetime.utcnow()
        return updated