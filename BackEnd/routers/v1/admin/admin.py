from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from models.appointment import Appointment
from routers.v1.dependencies import get_current_admin

router = APIRouter()

@router.get("/users", response_model=List[dict])
def get_all_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users with optional filtering (admin only)"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.order_by(User.created_at.desc()).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "fname": user.fname,
            "lname": user.lname,
            "name": f"{user.fname} {user.lname}",
            "role": user.role.value,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]

@router.get("/doctors/pending", response_model=List[dict])
def get_pending_doctors(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get doctors pending approval (admin only)"""
    doctors = db.query(Doctor).join(User).filter(
        User.role == UserRole.DOCTOR,
        Doctor.is_verified == False
    ).all()
    
    return [
        {
            "doctor_id": doctor.doctor_id,
            "user_id": doctor.user_id,
            "name": f"{doctor.user.fname} {doctor.user.lname}",
            "email": doctor.user.email,
            "license_number": doctor.license_number,
            "years_of_experience": doctor.years_of_experience,
            "specializations": doctor.specializations_json,
            "created_at": doctor.user.created_at,
            "prc_license_front": doctor.prc_license_front,
            "prc_license_back": doctor.prc_license_back,
            "prc_license_selfie": doctor.prc_license_selfie
        }
        for doctor in doctors
    ]

@router.put("/doctors/{doctor_id}/approve")
def approve_doctor(
    doctor_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve a doctor (admin only)"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if doctor.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is already approved"
        )
    
    doctor.is_verified = True
    doctor.user.is_doctor_approved = True
    doctor.user.approval_date = db.query(func.now()).scalar()
    doctor.user.approved_by = current_user.id
    
    db.commit()
    
    return {"message": "Doctor approved successfully"}

@router.put("/doctors/{doctor_id}/reject")
def reject_doctor(
    doctor_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject a doctor application (admin only)"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # You might want to add a rejection reason field to the Doctor model
    # For now, we'll just delete the doctor profile
    db.delete(doctor)
    db.commit()
    
    return {"message": "Doctor application rejected"}

@router.get("/stats", response_model=dict)
def get_admin_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    from sqlalchemy import func
    
    total_users = db.query(User).count()
    total_doctors = db.query(User).filter(User.role == UserRole.DOCTOR).count()
    total_patients = db.query(User).filter(User.role == UserRole.PATIENT).count()
    pending_doctors = db.query(Doctor).filter(Doctor.is_verified == False).count()
    total_appointments = db.query(Appointment).count()
    
    return {
        "total_users": total_users,
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "pending_doctors": pending_doctors,
        "total_appointments": total_appointments
    }

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update user active status (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = is_active
    db.commit()
    
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}