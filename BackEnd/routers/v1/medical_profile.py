from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import re

from core.database import get_db
from models.users import User, UserRole
from models.medical_profile import MedicalProfile
from schemas.medical_profile import MedicalProfileOut, MedicalProfileUpdate
from .dependencies import get_current_user

router = APIRouter(
    prefix="/medical-profile",
    tags=["Medical Profile"]
)

# ==========================================
# PATIENT ENDPOINTS (My Profile)
# ==========================================

@router.get("/me", response_model=MedicalProfileOut)
def get_my_medical_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's medical profile.
    If it doesn't exist yet, we create an empty one automatically
    so they have a medical_uid (QR Code) ready.
    """
    profile = db.query(MedicalProfile).filter(MedicalProfile.user_id == current_user.id).first()
    
    if not profile:
        # Auto-create profile on first access
        new_profile = MedicalProfile(user_id=current_user.id)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return new_profile
        
    return profile

@router.put("/me", response_model=MedicalProfileOut)
def update_my_medical_profile(
    profile_update: MedicalProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient updates their OWN info (Emergency Contact, etc.).
    """
    profile = db.query(MedicalProfile).filter(MedicalProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = MedicalProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update fields provided in the request
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile


# ==========================================
# DOCTOR ENDPOINTS (The Scanner)
# ==========================================

# Changed argument from `qr_uid: UUID` to `search_term: str`
@router.get("/scan/{search_term}") 
def scan_patient_qr(
    search_term: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    CRITICAL SECURITY ENDPOINT
    1. Checks if requester is a DOCTOR.
    2. SMART SEARCH:
       - If input looks like '202605' -> Extract '5' and search by User ID
       - If input is a UUID -> Search by unique medical_uid (QR Code)
    """
    
    # 1. Security Check
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can scan patient QR codes."
        )

    result = None
    
    # 2. Determine Search Strategy
    
    # STRATEGY A: Is it a Custom Student ID? (e.g. "2026012")
    # We check if it starts with "20260" and the rest are digits
    custom_id_match = re.match(r"^20260(\d+)$", search_term)
    
    if custom_id_match:
        # Extract the real ID (e.g., "12" from "2026012")
        extracted_id = int(custom_id_match.group(1))
        
        # Search by User ID directly
        result = db.query(MedicalProfile, User)\
            .join(User, MedicalProfile.user_id == User.id)\
            .filter(MedicalProfile.user_id == extracted_id)\
            .first()
            
    # STRATEGY B: Is it a valid UUID? (QR Code Scan)
    else:
        try:
            # Validate UUID format
            uuid_obj = UUID(search_term)
            
            # Search by Medical UUID
            result = db.query(MedicalProfile, User)\
                .join(User, MedicalProfile.user_id == User.id)\
                .filter(MedicalProfile.medical_uid == uuid_obj)\
                .first()
        except ValueError:
            # If it's neither a custom ID nor a UUID, fail early
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ID format. Please scan a valid QR or enter a Student ID (e.g., 202605)."
            )

    # 3. Process Result
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
        
    profile, user_data = result

    # 4. Return Merged Data
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "medical_uid": str(profile.medical_uid),
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "emergency_contact_name": profile.emergency_contact_name,
        "emergency_contact_number": profile.emergency_contact_number,
        # Joined User Data
        "fname": user_data.fname,
        "lname": user_data.lname,
        "picture": user_data.picture
    }