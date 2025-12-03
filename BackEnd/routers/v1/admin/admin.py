from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from routers.v1.dependencies import get_current_admin
from core.services.email import send_doctor_approval_email, send_doctor_rejection_email

router = APIRouter()
logger = logging.getLogger("bukcare")

# -----------------------------
# GET all users
# -----------------------------
@router.get("/users", response_model=List[dict])
def get_all_users(
    request: Request, 
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    users = query.order_by(User.created_at.desc()).all()
    base_url = str(request.base_url)

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
            "last_login": user.last_login,
            "contact_number": user.contact_number,
            "picture": (
                user.picture 
                if user.picture and user.picture.startswith("http")
                else f"{base_url}{user.picture}" if user.picture
                else f"{base_url}default-avatar.png"
            ),
            "province": user.province.name if user.province else None,
            "city": user.city.name if user.city else None,
            "barangay": user.barangay.name if user.barangay else None,
            "doctor_profile": {
                "doctor_id": user.doctor_profile.doctor_id if user.doctor_profile else None,
                "prc_license_front": user.doctor_profile.prc_license_front if user.doctor_profile else None,
                "prc_license_back": user.doctor_profile.prc_license_back if user.doctor_profile else None,
                "prc_license_selfie": user.doctor_profile.prc_license_selfie if user.doctor_profile else None,
                "license_number": user.doctor_profile.license_number if user.doctor_profile else None,
                "years_of_experience": user.doctor_profile.years_of_experience if user.doctor_profile else None,
                "bio": user.doctor_profile.bio if user.doctor_profile else None,
                "consultation_fee": user.doctor_profile.consultation_fee if user.doctor_profile else None,
            } if user.doctor_profile else None
        }
        for user in users
    ]

# -----------------------------
# GET pending doctors
# -----------------------------
@router.get("/doctors/pending", response_model=List[dict])
def get_pending_doctors(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    doctors = db.query(Doctor).join(User).filter(
        User.role == UserRole.PENDING,
        User.is_doctor_approved == False
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

# -----------------------------
# Approve doctor
# -----------------------------
@router.put("/doctors/{user_id}/approve")
def approve_doctor(user_id: int, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if not doctor:
        doctor = Doctor(user_id=user_id)
        db.add(doctor)
        db.commit()
        db.refresh(doctor)

    if user.is_doctor_approved:
        return {"message": "Doctor is already approved"}

    user.is_doctor_approved = True
    user.approval_date = func.now()
    user.approved_by = current_user.id
    db.commit()

    try:
        send_doctor_approval_email(user)
    except Exception as e:
        logger.error(f"Failed to send doctor approval email to {user.email}: {e}")

    return {"message": "Doctor approved successfully, email notification sent"}

# -----------------------------
# Reject doctor
# -----------------------------
@router.put("/doctors/{user_id}/reject")
def reject_doctor(
    user_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        send_doctor_rejection_email(user, reason)
    except Exception as e:
        logger.error(f"Failed to send doctor rejection email to {user.email}: {e}")

    db.delete(user)  # deletes User + Doctor + DoctorAvailability + linked appointments/notifications if cascade set
    db.commit()

    return {"message": "Doctor application rejected and all data deleted successfully"}


# -----------------------------
# Update user status
# -----------------------------
@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, is_active: bool, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    db.commit()
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}


# -----------------------------
# Dashboard Statistics
# -----------------------------
@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Total Users
    total_users = db.query(func.count(User.id)).scalar()

    # Total Patients
    total_patients = db.query(func.count(User.id)).filter(User.role == UserRole.PATIENT).scalar()

    # Total Doctors
    total_doctors = db.query(func.count(User.id)).filter(User.role == UserRole.DOCTOR).scalar()

    # Total Admins
    total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar()

    # Total Appointments (check if you have Appointment model later)
    try:
        from models.appointment import Appointment
        total_appointments = db.query(func.count(Appointment.id)).scalar()
    except Exception:
        total_appointments = 0  # temporary fallback if model not yet ready

    # Pending doctor approvals
    pending_doctors = db.query(func.count(User.id)).filter(
        User.role == UserRole.PENDING,
        User.is_doctor_approved == False
    ).scalar()

    # Active users (logged in last 7 days)
    active_users = db.query(func.count(User.id)).filter(
        User.last_login != None,
        func.now() - User.last_login <= func.interval('7 days')
    ).scalar()

    # New users registered this week
    new_users_this_week = db.query(func.count(User.id)).filter(
        func.date(User.created_at) >= func.date(func.now() - func.interval('7 days'))
    ).scalar()

    return {
        "totalUsers": total_users,
        "totalPatients": total_patients,
        "totalDoctors": total_doctors,
        "totalAdmins": total_admins,
        "totalAppointments": total_appointments,
        "pendingDoctorApprovals": pending_doctors,
        "activeUsers": active_users,
        "newUsersThisWeek": new_users_this_week,
    }
