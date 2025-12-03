from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
import logging
from datetime import datetime, timedelta, time

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
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
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

    db.delete(user)
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
# Dashboard Statistics (FIXED)
# -----------------------------
@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        # 1. Basic Counts
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_patients = db.query(func.count(User.id)).filter(User.role == UserRole.PATIENT).scalar() or 0
        total_doctors = db.query(func.count(User.id)).filter(User.role == UserRole.DOCTOR).scalar() or 0
        total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0

        # 2. Appointments (Safety Check)
        try:
            from models.appointment import Appointment
            total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
        except Exception:
            total_appointments = 0

        # 3. Status Specifics
        pending_doctors = db.query(func.count(User.id)).filter(
            User.role == UserRole.PENDING,
            User.is_doctor_approved == False
        ).scalar() or 0

        # Active users logic (Safe Python comparison)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.query(func.count(User.id)).filter(
            User.last_login >= week_ago
        ).scalar() or 0

        new_users_this_week = db.query(func.count(User.id)).filter(
            User.created_at >= week_ago
        ).scalar() or 0

        # 4. Weekly Growth Data (Safe Date Range Approach)
        weekly_growth = []
        today = datetime.utcnow().date()
        
        for i in range(6, -1, -1):
            date_target = today - timedelta(days=i)
            day_name = date_target.strftime("%a") # "Mon", "Tue"
            
            # Create a full day range for filtering: 00:00:00 to 23:59:59
            start_of_day = datetime.combine(date_target, time.min)
            end_of_day = datetime.combine(date_target, time.max)
            
            # Use standard >= and <= comparisons which work on ALL databases (Postgres/SQLite/MySQL)
            daily_stats = db.query(
                func.sum(case((User.role == UserRole.PATIENT, 1), else_=0)).label('patients'),
                func.sum(case((User.role == UserRole.DOCTOR, 1), else_=0)).label('doctors'),
                func.sum(case((User.role == UserRole.ADMIN, 1), else_=0)).label('admins')
            ).filter(
                User.created_at >= start_of_day,
                User.created_at <= end_of_day
            ).first()

            # Safely extract and cast to int to prevent JSON serialization errors
            weekly_growth.append({
                "name": day_name,
                "patients": int(daily_stats.patients or 0),
                "doctors": int(daily_stats.doctors or 0),
                "admins": int(daily_stats.admins or 0)
            })

        return {
            "totalUsers": total_users,
            "totalPatients": total_patients,
            "totalDoctors": total_doctors,
            "totalAdmins": total_admins,
            "totalAppointments": total_appointments,
            "pendingDoctorApprovals": pending_doctors,
            "activeUsers": active_users,
            "newUsersThisWeek": new_users_this_week,
            "weeklyGrowth": weekly_growth
        }
    
    except Exception as e:
        # This will print the exact Python error to your terminal so we can debug if it fails again
        import traceback
        traceback.print_exc() 
        logger.error(f"Dashboard Stats Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error: Failed to generate statistics")