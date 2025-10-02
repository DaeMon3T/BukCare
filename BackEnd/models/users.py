# models/users.py - Updated User model with Google OAuth fields
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum
from models.address import Address


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    STAFF = "staff"
    PATIENT = "patient"

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    
    # ========== FROM GOOGLE OAUTH ==========
    email = Column(String, unique=True, index=True, nullable=False)  # ✅ From Google
    fname = Column(String, nullable=False)                            # ✅ From Google (given_name)
    lname = Column(String, nullable=False)                            # ✅ From Google (family_name)
    google_id = Column(String, unique=True, nullable=True)           # ✅ From Google (sub)
    picture = Column(String, nullable=True)                           # ✅ From Google (profile picture URL)
    locale = Column(String, nullable=True)                            # ✅ From Google (e.g., "en", "fil")
    
    # ========== COLLECTED AFTER GOOGLE OAUTH ==========
    mname = Column(String, nullable=True)                            # ❌ Must collect (optional)
    sex = Column(Boolean, nullable=True)                             # ❌ Must collect (True=Male, False=Female)
    dob = Column(DateTime, nullable=True)                            # ❌ Must collect
    contact_number = Column(String, nullable=True)                   # ❌ Must collect
    #address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)  # ❌ Must collect
    
    # ========== OPTIONAL: FOR EMAIL/PASSWORD LOGIN ==========
    password = Column(String, nullable=True)  # ❌ User can set this to enable email/password login
    
    # ========== ACCOUNT STATUS ==========
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # True after Google OAuth (email verified)
    is_profile_complete = Column(Boolean, default=False)  # False until additional data collected
    
    # ========== TOKEN MANAGEMENT ==========
    refresh_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # ========== RELATIONSHIPS ==========
    address_id = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    address = relationship("Address", back_populates="users")
    #notifications = relationship("Notification", back_populates="user")
    
    # ========== TIMESTAMPS ==========
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


# ========== EXAMPLE: Complete Google OAuth Data Flow ==========
"""
STEP 1: User Signs In with Google
==================================
Google provides this data in id_token:

idinfo = {
    "sub": "108909876543210987654",        # → google_id (unique identifier)
    "email": "juan.delacruz@gmail.com",    # → email (verified)
    "email_verified": True,                # → is_verified = True
    "given_name": "Juan",                  # → fname
    "family_name": "Dela Cruz",            # → lname
    "name": "Juan Dela Cruz",              # Full name (displayed in UI)
    "picture": "https://lh3.googleusercontent.com/...", # → picture
    "locale": "en"                         # → locale (or "fil" for Filipino)
}

Backend creates user with:
- email: "juan.delacruz@gmail.com"
- fname: "Juan"
- lname: "Dela Cruz"
- google_id: "108909876543210987654"
- picture: "https://lh3.googleusercontent.com/..."
- locale: "en"
- is_verified: True (Google verified the email)
- is_profile_complete: False (needs to complete profile)


STEP 2: Redirect to Complete Profile Page
=========================================
Frontend displays:
✅ Email: juan.delacruz@gmail.com (from Google)
✅ Name: Juan Dela Cruz (from Google)
✅ Picture: Profile photo (from Google)

User must provide:
❌ Sex: Male/Female (required)
❌ Date of Birth: 1990-05-15 (required)
❌ Contact Number: 09171234567 (required)
❌ Password: optional (for email/password login)


STEP 3: Complete Profile Submission
===================================
POST /auth/complete-profile
{
    "user_id": 1,
    "sex": true,                    # True = Male
    "dob": "1990-05-15",
    "contact_number": "09171234567",
    "password": "SecurePass123"     # Optional
}

Backend updates user:
- sex: True (Male)
- dob: 1990-05-15
- contact_number: "09171234567"
- password: <hashed> (if provided)
- is_profile_complete: True
- updated_at: now()


STEP 4: User Can Now Login Two Ways
===================================
Option 1: Google OAuth
- Click "Sign in with Google"
- Instant login (no password needed)

Option 2: Email + Password (if password was set)
- Email: juan.delacruz@gmail.com
- Password: SecurePass123
- Traditional login


FINAL USER RECORD IN DATABASE
==============================
{
    "user_id": 1,
    "email": "juan.delacruz@gmail.com",
    "fname": "Juan",
    "lname": "Dela Cruz",
    "mname": null,
    "google_id": "108909876543210987654",
    "picture": "https://lh3.googleusercontent.com/...",
    "locale": "en",
    "sex": true,                    # Male
    "dob": "1990-05-15",
    "contact_number": "09171234567",
    "password": "<bcrypt_hash>",    # Set if user provided password
    "address_id": null,
    "role": "patient",
    "is_active": true,
    "is_verified": true,
    "is_profile_complete": true,
    "created_at": "2025-01-15 10:30:00",
    "last_login": "2025-01-15 10:35:00"
}
"""