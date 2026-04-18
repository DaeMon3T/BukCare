from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
import logging
from datetime import datetime, timedelta, time
import csv
import io

from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from models.staff import Staff
from routers.v1.dependencies import get_current_admin
from core.services.email import send_doctor_approval_email, send_doctor_rejection_email
from core.services.audit import log_audit_action
from models.audit_log import AuditLog, AuditActionType

from core.socket_manager import manager

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
async def approve_doctor(user_id: int, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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
    user.role = UserRole.DOCTOR
    user.approval_date = func.now()
    user.approved_by = current_user.id
    db.commit()


    try:
        send_doctor_approval_email(user)

        await manager.send_personal_message(
        {
            "type": "DOCTOR_APPROVED",
            "title": "Application Approved",
            "message": "Congratulations! Your doctor application has been approved."
        },
        user_id=str(user_id)
    )
    except Exception as e:
        logger.error(f"Failed to send doctor approval email to {user.email}: {e}")

    log_audit_action(
        db=db,
        action=AuditActionType.UPDATE,
        entity_name="Doctor",
        entity_id=user.id,
        user_id=current_user.id,
        details=f"Admin approved doctor application for user {user.id}"
    )

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

    log_audit_action(
        db=db,
        action=AuditActionType.DELETE,
        entity_name="Doctor",
        entity_id=user_id,
        user_id=current_user.id,
        details=f"Admin rejected doctor application for user {user_id}. Reason: {reason or 'None given'}"
    )

    return {"message": "Doctor application rejected and all data deleted successfully"}

# -----------------------------
# GET pending staff
# -----------------------------
@router.get("/staff/pending", response_model=List[dict])
def get_pending_staff(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    staff_list = db.query(Staff).join(User).filter(
        User.role == UserRole.PENDING,
        User.is_staff_approved == False
    ).all()
    return [
        {
            "staff_id": s.staff_id,
            "user_id": s.user_id,
            "name": f"{s.user.fname} {s.user.lname}",
            "email": s.user.email,
            "job_title": s.job_title,
            "created_at": s.user.created_at,
            "proof_front": s.proof_front,
            "proof_back": s.proof_back,
            "proof_selfie": s.proof_selfie
        }
        for s in staff_list
    ]

# -----------------------------
# Approve staff
# -----------------------------
@router.put("/staff/{user_id}/approve")
async def approve_staff(user_id: int, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_staff_approved:
        return {"message": "Staff is already approved"}

    user.is_staff_approved = True
    user.role = UserRole.STAFF
    user.approval_date = func.now()
    user.approved_by = current_user.id
    db.commit()

    try:
        await manager.send_personal_message(
            {
                "type": "STAFF_APPROVED",
                "title": "Application Approved",
                "message": "Congratulations! Your staff application has been approved. You can now log in."
            },
            user_id=str(user_id)
        )
    except Exception as e:
        logger.error(f"Failed to send staff approval notification to {user.email}: {e}")

    log_audit_action(
        db=db,
        action=AuditActionType.UPDATE,
        entity_name="Staff",
        entity_id=user.id,
        user_id=current_user.id,
        details=f"Admin approved staff application for user {user.id}"
    )

    return {"message": "Staff approved successfully"}

# -----------------------------
# Reject staff
# -----------------------------
@router.put("/staff/{user_id}/reject")
def reject_staff(
    user_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    log_audit_action(
        db=db,
        action=AuditActionType.DELETE,
        entity_name="Staff",
        entity_id=user_id,
        user_id=current_user.id,
        details=f"Admin rejected staff application for user {user_id}. Reason: {reason or 'None given'}"
    )

    return {"message": "Staff application rejected and all data deleted successfully"}


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
    
    # Log this action
    action = "activate" if is_active else "deactivate"
    log_audit_action(
        db=db,
        action=AuditActionType.UPDATE,
        entity_name="User",
        entity_id=user.id,
        user_id=current_user.id,
        details=f"Admin {action}d user {user.id}"
    )
    return {"message": f"User {action}d successfully"}


# -----------------------------
# Dashboard Statistics (FIXED)
# -----------------------------
@router.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_patients = db.query(func.count(User.id)).filter(User.role == UserRole.PATIENT).scalar() or 0
        total_doctors = db.query(func.count(User.id)).filter(User.role == UserRole.DOCTOR).scalar() or 0
        total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0
        total_staff = db.query(func.count(User.id)).filter(User.role == UserRole.STAFF).scalar() or 0

        pending_appointments = 0
        confirmed_appointments = 0
        completed_appointments = 0
        cancelled_appointments = 0

        try:
            from models.appointment import Appointment, AppointmentStatus
            total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
            pending_appointments = db.query(func.count(Appointment.id)).filter(Appointment.status == AppointmentStatus.PENDING).scalar() or 0
            confirmed_appointments = db.query(func.count(Appointment.id)).filter(Appointment.status == AppointmentStatus.CONFIRMED).scalar() or 0
            completed_appointments = db.query(func.count(Appointment.id)).filter(Appointment.status == AppointmentStatus.COMPLETED).scalar() or 0
            cancelled_appointments = db.query(func.count(Appointment.id)).filter(Appointment.status == AppointmentStatus.CANCELLED).scalar() or 0
        except Exception:
            total_appointments = 0

        pending_doctors = db.query(func.count(User.id)).filter(
            User.role == UserRole.PENDING,
            User.is_doctor_approved == False
        ).scalar() or 0

        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.query(func.count(User.id)).filter(
            User.last_login >= week_ago
        ).scalar() or 0

        new_users_this_week = db.query(func.count(User.id)).filter(
            User.created_at >= week_ago
        ).scalar() or 0

        weekly_growth = []
        today = datetime.utcnow().date()
        
        for i in range(6, -1, -1):
            date_target = today - timedelta(days=i)
            day_name = date_target.strftime("%a")
            
            start_of_day = datetime.combine(date_target, time.min)
            end_of_day = datetime.combine(date_target, time.max)
            
            daily_stats = db.query(
                func.sum(case((User.role == UserRole.PATIENT, 1), else_=0)).label('patients'),
                func.sum(case((User.role == UserRole.DOCTOR, 1), else_=0)).label('doctors'),
                func.sum(case((User.role == UserRole.ADMIN, 1), else_=0)).label('admins'),
                func.sum(case((User.role == UserRole.STAFF, 1), else_=0)).label('staffs')
            ).filter(
                User.created_at >= start_of_day,
                User.created_at <= end_of_day
            ).first()

            # Safely extract and cast to int to prevent JSON serialization errors
            weekly_growth.append({
                "name": day_name,
                "patients": int(daily_stats.patients or 0),
                "doctors": int(daily_stats.doctors or 0),
                "admins": int(daily_stats.admins or 0),
                "staffs": int(daily_stats.staffs or 0)
            })

        return {
            "totalUsers": total_users,
            "totalPatients": total_patients,
            "totalDoctors": total_doctors,
            "totalAdmins": total_admins,
            "totalStaff": total_staff,
            "totalAppointments": total_appointments,
            "appointmentsBreakdown": {
                "pending": pending_appointments,
                "confirmed": confirmed_appointments,
                "completed": completed_appointments,
                "cancelled": cancelled_appointments
            },
            "pendingDoctorApprovals": pending_doctors,
            "activeUsers": active_users,
            "newUsersThisWeek": new_users_this_week,
            "weeklyGrowth": weekly_growth
        }
    
    # -----------------------------
    # Error Handling for Dashboard Stats
    # -----------------------------
    except Exception as e:
        import traceback
        traceback.print_exc() 
        logger.error(f"Dashboard Stats Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error: Failed to generate statistics")

# -----------------------------
# Export Report Functionality
# -----------------------------
@router.get("/export-report")
def export_report(
    report_type: str = "users", # "users" or "appointments"
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        if report_type == "users":
            users = db.query(User).all()
            writer.writerow(["ID", "Name", "Email", "Role", "Status", "Registered Date"])
            for u in users:
                writer.writerow([
                    u.id, 
                    f"{u.fname} {u.lname}", 
                    u.email, 
                    u.role.value if hasattr(u.role, 'value') else u.role, 
                    "Active" if u.is_active else "Inactive", 
                    u.created_at.strftime("%Y-%m-%d") if u.created_at else "N/A"
                ])
            filename = f"users_report_{datetime.now().strftime('%Y%m%d')}.csv"
        
        elif report_type == "appointments":
            from models.appointment import Appointment
            appointments = db.query(Appointment).all()
            writer.writerow(["ID", "Patient ID", "Doctor ID", "Date", "Status", "Reason"])
            for a in appointments:
                writer.writerow([
                    a.id, 
                    a.patient_id, 
                    a.doctor_id, 
                    a.appointment_date.strftime("%Y-%m-%d %H:%M") if a.appointment_date else "N/A", 
                    a.status.value if hasattr(a.status, 'value') else a.status, 
                    a.reason or "N/A"
                ])
            filename = f"appointments_report_{datetime.now().strftime('%Y%m%d')}.csv"
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Export Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export report")

# -----------------------------
# GET Audit Logs
# -----------------------------
@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    count = db.query(AuditLog).count()
    return {
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": f"{log.user.fname} {log.user.lname}" if log.user else "System",
                "action": log.action.value if hasattr(log.action, 'value') else log.action,
                "entity_name": log.entity_name,
                "entity_id": log.entity_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": count
    }