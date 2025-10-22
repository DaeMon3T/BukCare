# routers/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from routers.v1.dependencies import get_current_admin

router = APIRouter(tags=["Admin"])


# ========================
# Admin Dashboard Stats
# ========================
@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    Returns basic counts of users for the admin dashboard.
    """
    total_patients = db.query(User).filter(User.role == UserRole.PATIENT).count()
    total_doctors = db.query(User).filter(User.role == UserRole.DOCTOR).count()
    total_staff = db.query(User).filter(User.role == UserRole.STAFF).count() if hasattr(UserRole, "STAFF") else 0
    total_pending = db.query(User).filter(User.role == UserRole.PENDING).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "pending_approvals": total_pending,
        "active_sessions": 0,  # placeholder for future features
        "pending_invites": 0   # now always 0 since invite feature is removed
    }


# ========================
# List All Users
# ========================
@router.get("/users")
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    List all users (patients, doctors, etc.)
    """
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "fname": user.fname,
            "lname": user.lname,
            "email": user.email,
            "role": user.role.value,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ========================
# List All Doctors
# ========================
@router.get("/doctors")
def get_all_doctors(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    List all doctors including pending ones
    """
    doctors = db.query(Doctor).join(User).all()
    return [
        {
            "doctor_id": doctor.id,
            "user_id": doctor.user_id,
            "name": f"{doctor.user.fname} {doctor.user.lname}",
            "email": doctor.user.email,
            "license_number": doctor.license_number,
            "years_of_experience": doctor.years_of_experience,
            "is_verified": doctor.is_verified,
            "specializations": doctor.specializations_json,
            "role": doctor.user.role.value,
        }
        for doctor in doctors
    ]


# ========================
# Approve Doctor
# ========================
@router.put("/approve-doctor/{user_id}")
def approve_doctor(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    Approve a pending doctor (admin action)
    """
    user = db.query(User).filter(User.id == user_id).first()
    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()

    if not user or not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Update approval
    doctor.is_verified = True
    user.role = UserRole.DOCTOR
    user.is_verified = True

    db.commit()
    db.refresh(user)
    db.refresh(doctor)

    return {
        "message": "Doctor approved successfully",
        "user": {
            "id": user.id,
            "name": f"{user.fname} {user.lname}",
            "email": user.email,
            "role": user.role.value,
            "is_verified": user.is_verified,
        },
        "doctor": {
            "license_number": doctor.license_number,
            "years_of_experience": doctor.years_of_experience,
            "specializations": doctor.specializations_json,
            "is_verified": doctor.is_verified,
        }
    }
