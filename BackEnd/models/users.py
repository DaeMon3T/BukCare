# models/users.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, Session
from datetime import datetime
from core.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    STAFF = "staff"
    PATIENT = "patient"

class User(Base):
    __tablename__ = "users"
    
    # Instead of autoincrement, we’ll manage our own custom ID
    user_id = Column(String, primary_key=True, index=True, unique=True, nullable=False)

    # Personal info
    email = Column(String, unique=True, index=True, nullable=False)  
    fname = Column(String, nullable=False)                           
    lname = Column(String, nullable=False)                           
    google_id = Column(String, unique=True, nullable=True)           
    picture = Column(String, nullable=True)                          
    locale = Column(String, nullable=True)                           
    mname = Column(String, nullable=True)                           
    sex = Column(Boolean, nullable=True)                            
    dob = Column(DateTime, nullable=True)                           
    contact_number = Column(String, nullable=True)                   
    
    # Authentication
    password = Column(String, nullable=True)
    
    # Account status
    role = Column(Enum(UserRole, name="user_role_enum"), default=UserRole.PATIENT)
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
    sent_invitations = relationship("Invitation", back_populates="inviter", cascade="all, delete-orphan")
    
    # Appointment relationships
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
    
    # Doctor-specific relationship
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    
    # Notifications
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

    # --- Custom ID Generator ---
    @staticmethod
    def generate_id(session: Session):
        """
        Generate user_id like YYYYMMDDNNN:
        - YYYYMMDD = current date
        - NNN = incremental number for users created today
        Example: 20251004001, 20251004002
        """
        from sqlalchemy import select

        today_prefix = datetime.now().strftime("%Y%m%d")  # e.g., '20251004'

        # Get the last user created today
        last_user = session.execute(
            select(User).where(User.user_id.startswith(today_prefix)).order_by(User.user_id.desc())
        ).scalars().first()

        if last_user:
            # Extract numeric suffix and increment
            last_suffix = int(last_user.user_id[-3:])
            new_suffix = last_suffix + 1
        else:
            new_suffix = 1

        # Format ID as YYYYMMDDNNN
        return f"{today_prefix}{new_suffix:03d}"  # e.g., '20251004001'