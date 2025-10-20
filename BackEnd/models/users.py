from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    PENDING = "pending"  # for doctors waiting for admin approval


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    email = Column(String, unique=True, index=True, nullable=False)
    fname = Column(String, nullable=False)
    mname = Column(String, nullable=True)
    lname = Column(String, nullable=False)
    sex = Column(Boolean, nullable=True)
    dob = Column(DateTime, nullable=True)
    contact_number = Column(String, nullable=True)

    google_id = Column(String, unique=True, nullable=True)
    picture = Column(String, nullable=True)
    password = Column(String, nullable=True)

    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_profile_complete = Column(Boolean, default=False)

    # Doctor approval fields
    is_doctor_approved = Column(Boolean, default=False)
    approval_date = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Auth management
    refresh_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Location references
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="SET NULL"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    barangay_id = Column(Integer, ForeignKey("barangays.id", ondelete="SET NULL"), nullable=True)

    # Relationships - Location
    province = relationship("Province")
    city = relationship("City")
    barangay = relationship("Barangay")

    # Relationships - Appointments
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

    # Relationships - Doctor Profile
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)

    # Relationships - Notifications
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

    # Self-relationship for admin approvals
    approved_by_user = relationship("User", remote_side=[id])

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    @classmethod
    def from_oauth(cls, data: dict):
        """
        Create a new User from Google OAuth data.
        If role is missing or invalid, default to PATIENT.
        """
        role_value = data.get("role")
        if role_value in UserRole._value2member_map_:
            role = UserRole(role_value)
        else:
            role = UserRole.PATIENT  # Default role for new OAuth users

        # For doctors registering via OAuth, default to PENDING until approved
        if role == UserRole.DOCTOR:
            role = UserRole.PENDING

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
        """
        Update existing user fields from OAuth data.
        Returns True if any fields were updated.
        """
        updated = False

        if not self.google_id:
            self.google_id = data.get("google_id")
            updated = True

        for field in ["fname", "lname", "picture"]:
            new_value = data.get(field)
            if new_value and getattr(self, field) != new_value:
                setattr(self, field, new_value)
                updated = True

        # Only update role if provided and valid
        if "role" in data and data["role"] in UserRole._value2member_map_:
            new_role = UserRole(data["role"])
            if self.role != new_role:
                self.role = new_role
                updated = True

        self.last_login = datetime.utcnow()
        return updated
