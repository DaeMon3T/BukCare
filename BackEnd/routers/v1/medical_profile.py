from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

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
# 1. PATIENT ENDPOINTS (My Profile)
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
    Note: In a stricter version, we might prevent them from changing 
    Blood Type/Allergies without doctor approval.
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
# 2. DOCTOR ENDPOINTS (The Scanner)
# ==========================================

@router.get("/scan/{qr_uid}", response_model=MedicalProfileOut)
def scan_patient_qr(
    qr_uid: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    CRITICAL SECURITY ENDPOINT
    1. Checks if the requester is actually a DOCTOR.
    2. Looks up the patient by the unique UUID from the QR code.
    """
    
    # 1. Security Check: Only Doctors (or Admins) can scan
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can scan patient QR codes."
        )

    # 2. Database Lookup
    profile = db.query(MedicalProfile).filter(MedicalProfile.medical_uid == qr_uid).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid QR Code. Patient profile not found."
        )
        
    return profile