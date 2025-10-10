# routers/v1/auth.py - Complete Authentication System with Google Data
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from jose import jwt, JWTError
from models.users import User

from sqlalchemy.orm import Session
from datetime import datetime
from passlib.context import CryptContext
from fastapi.security import HTTPBearer
import os

from schemas.auth import DoctorSignupRequest
from models.invitation import Invitation
from models.doctor import Doctor, Specialization
from core.security import get_password_hash


from core.database import get_db
from .dependencies import get_current_user
from models.users import User
from core.security import (
    create_access_token, 
    create_refresh_token,
    ACCESS_TOKEN_EXPIRE_SECONDS
)
from core.config import settings
from models.users import User, UserRole
from schemas.auth import (
    GoogleAuthRequest, 
    LoginRequest, 
    RegisterRequest,
    CompleteProfileRequest
)

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def build_response(user, access_token, refresh_token):
    return {
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
        },
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "fname": user.fname,
            "lname": user.lname,
            "name": f"{user.fname} {user.lname}",
            "picture": user.picture,
            "role": user.role.value,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
            "user_type": user.role.value,
        }
    }


@router.post("/google")
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Google OAuth for Sign-In/Sign-Up (Unified)
    - If user exists: Sign in
    - If user doesn't exist: Create account (profile incomplete)
    - Stores: email, fname, lname, picture, locale, google_id
    """
    from google.auth.transport import requests
    from google.oauth2 import id_token

    try:
        idinfo = id_token.verify_oauth2_token(
            request.id_token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = idinfo["email"]

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Auto-create user with Google data
        user = User(
            user_id=User.generate_id(db), 
            email=email,
            fname=idinfo.get("given_name", ""),
            lname=idinfo.get("family_name", ""),
            google_id=idinfo["sub"],
            picture=idinfo.get("picture", ""),
            locale=idinfo.get("locale", "en"),
            is_verified=True,  # Email verified by Google
            is_active=True,
            is_profile_complete=False,  # Need to collect additional data
            role=UserRole.PATIENT
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        # Link Google account to existing user and update data
        user.google_id = idinfo["sub"]
        user.fname = idinfo.get("given_name", user.fname)
        user.lname = idinfo.get("family_name", user.lname)
        user.picture = idinfo.get("picture", user.picture)
        user.locale = idinfo.get("locale", user.locale)
        user.is_verified = True
        db.commit()
    else:
        # Update picture and locale on each login (in case changed)
        user.picture = idinfo.get("picture", user.picture)
        user.locale = idinfo.get("locale", user.locale)
        db.commit()

    # Issue tokens
    access_token = create_access_token({
        "user_id": user.user_id, 
        "email": user.email, 
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.user_id, 
        "email": user.email
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()

    return build_response(user, access_token, refresh_token)


@router.post("/complete-profile")
async def complete_profile(
    request: CompleteProfileRequest, 
    db: Session = Depends(get_db)
):
    """
    Complete user profile after Google OAuth
    Collects: sex, dob, contact_number, address_id, password (optional)
    """
    user = db.query(User).filter(User.user_id == str(request.user_id)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_profile_complete:
        raise HTTPException(status_code=400, detail="Profile already completed")
    
    # Update user information
    user.sex = request.sex
    user.dob = request.dob
    user.contact_number = request.contact_number
    user.address_id = request.address_id
    
    # Set password if provided (allows email/password login later)
    if request.password:
        user.password = pwd_context.hash(request.password)
    
    user.is_profile_complete = True
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    # Generate new tokens with updated info
    access_token = create_access_token({
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.user_id,
        "email": user.email
    })
    
    user.refresh_token = refresh_token
    db.commit()
    
    return build_response(user, access_token, refresh_token)


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email + password
    Only works if user has set a password (traditional signup or completed profile)
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )
    
    # Check if user has a password set
    if not user.password:
        raise HTTPException(
            status_code=401,
            detail="Please sign in with Google or set a password first"
        )

    # Verify password
    if not pwd_context.verify(data.password, user.password):
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )

    # Generate tokens
    access_token = create_access_token({
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.user_id,
        "email": user.email
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()

    return build_response(user, access_token, refresh_token)


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Traditional email/password registration with complete profile data
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = pwd_context.hash(request.password)
    
    # Create new user with complete profile
    new_user = User(
        email=request.email,
        password=hashed_password,
        fname=request.fname,
        lname=request.lname,
        mname=request.mname,
        contact_number=request.contact_number,
        dob=request.dob,
        sex=request.sex,
        address_id=request.address_id,
        role=UserRole.PATIENT,
        is_verified=False,  # Email verification pending
        is_active=True,
        is_profile_complete=True,  # All data collected upfront
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    access_token = create_access_token({
        "user_id": new_user.user_id,
        "email": new_user.email,
        "role": new_user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": new_user.user_id,
        "email": new_user.email
    })
    
    new_user.refresh_token = refresh_token
    new_user.last_login = datetime.utcnow()
    db.commit()
    
    return build_response(new_user, access_token, refresh_token)


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Logout - Clears refresh_token if user_id found in token
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get("user_id")

            if user_id:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    user.refresh_token = None
                    db.commit()

        except JWTError as e:
            print(f"Logout token decode failed: {e}")

    return {"message": "Successfully logged out"}


@router.get("/validate-invite/{token}")
def validate_invitation(token: str, db: Session = Depends(get_db)):
    """Validate invitation token and return email/role"""
    invite = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending",
        Invitation.expires_at > datetime.utcnow()
    ).first()
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    
    return {"email": invite.email, "role": invite.role}


@router.post("/doctor-signup")
def doctor_signup(request: DoctorSignupRequest, db: Session = Depends(get_db)):
    """Complete doctor signup with invitation token"""
    
    # 1. Validate invitation
    invite = db.query(Invitation).filter(
        Invitation.token == request.invite_token,
        Invitation.status == "pending",
        Invitation.expires_at > datetime.utcnow()
    ).first()
    
    if not invite or invite.role != "doctor":
        raise HTTPException(status_code=400, detail="Invalid or expired doctor invitation")
    
    # 2. Check if email matches invitation
    if invite.email != request.email:
        raise HTTPException(status_code=400, detail="Email does not match invitation")
    
    # 3. Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # 4. Create User
    hashed_password = get_password_hash(request.password)
    new_user = User(
        user_id=User.generate_id(db), 
        email=request.email,
        fname=request.fname,
        lname=request.lname,
        mname=request.mname,
        password=hashed_password,
        contact_number=request.phone,
        role=UserRole.DOCTOR,
        is_active=True,
        is_verified=True,  # Auto-verified since invited by admin
        is_profile_complete=True  # Doctor signup includes all required info
    )
    db.add(new_user)
    db.flush()  # Get user_id without committing
    
    # 5. Handle specializations
    specializations = []
    for spec_name in request.specialization:
        if spec_name == "Other" and request.other_specialization:
            spec_name = request.other_specialization
        
        # Find or create specialization
        specialization = db.query(Specialization).filter(
            Specialization.name == spec_name
        ).first()
        
        if not specialization:
            specialization = Specialization(name=spec_name)
            db.add(specialization)
            db.flush()
        
        specializations.append(specialization.specialization_id)
    
    # 6. Create Doctor profile (use first specialization as primary)
    doctor = Doctor(
        user_id=new_user.user_id,
        specialization_id=specializations[0] if specializations else None,
        license_number=request.license_number,
        years_of_experience=0  # Default, can be updated later
    )
    db.add(doctor)
    
    # 7. Mark invitation as accepted
    invite.status = "accepted"
    
    # 8. Commit all changes
    db.commit()
    db.refresh(new_user)
    
    # 9. Generate tokens for automatic sign-in
    access_token = create_access_token({
        "user_id": new_user.user_id,
        "email": new_user.email,
        "role": new_user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": new_user.user_id,
        "email": new_user.email
    })
    
    new_user.refresh_token = refresh_token
    new_user.last_login = datetime.utcnow()
    db.commit()
    
    # 10. Return full auth response (same format as other endpoints)
    return build_response(new_user, access_token, refresh_token)