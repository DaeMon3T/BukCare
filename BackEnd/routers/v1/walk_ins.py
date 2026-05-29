from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, Integer
from typing import List, Optional
from core.database import get_db
from models.users import User, UserRole
from models.appointment import Appointment, AppointmentStatus, AppointmentType
from schemas.appointment import AppointmentCreate, AppointmentResponse
from routers.v1.dependencies import get_current_user
from datetime import datetime, time as dt_time
from models.notification import Notification
from core.socket_manager import manager
from pydantic import BaseModel
from core.security import get_password_hash
from models.medical_profile import MedicalProfile
from models.doctor import Doctor, DoctorAvailability
from sqlalchemy.orm import joinedload
from utils.email import EmailService
from utils.appointment_helpers import check_appointment_conflict
import json

router = APIRouter()


def ensure_walkin_access(current_user: User, allow_doctor: bool = False):
    """Walk-in front-desk operations are a baseline capability for any admin-approved
    staff member (no per-doctor grant required). Admins always pass; doctors pass only
    when allow_doctor is set."""
    role = current_user.role
    if role == UserRole.ADMIN:
        return
    if role == UserRole.DOCTOR and allow_doctor:
        return
    if role == UserRole.STAFF:
        if not current_user.is_staff_approved:
            raise HTTPException(status_code=403, detail="Your staff account is pending admin approval")
        return
    raise HTTPException(status_code=403, detail="Not authorized")


# ============================================
# GET AVAILABLE DOCTORS (For Walk-in Picker)
# ============================================
@router.get("/available-doctors", response_model=list)
def get_available_doctors_for_walkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all approved doctors with their specializations and availability slots."""
    ensure_walkin_access(current_user)

    doctors = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.specializations),
            joinedload(Doctor.availabilities),
        )
        .join(User)
        .filter(User.is_doctor_approved == True)
        .all()
    )

    results = []
    for doc in doctors:
        specs_list = [s.name for s in doc.specializations]
        availabilities = [
            {
                "id": a.id,
                "date": a.date.isoformat() if a.date else None,
                "day_of_week": a.day_of_week,
                "start_time": a.start_time.strftime("%H:%M") if a.start_time else None,
                "end_time": a.end_time.strftime("%H:%M") if a.end_time else None,
                "is_available": a.is_available,
            }
            for a in doc.availabilities if a.is_available
        ]

        results.append({
            "user_id": doc.user_id,
            "name": f"{doc.user.fname} {doc.user.lname}",
            "specializations": specs_list if specs_list else ["General Practice"],
            "avatar": doc.user.picture,
            "status": doc.status,
            "consultation_fee": doc.consultation_fee,
            "availabilities": availabilities,
        })

    return results

class WalkInPatientCreate(BaseModel):
    fname: str
    lname: str
    email: str
    contact_number: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[bool] = None

@router.get("/patients/search", response_model=List[dict])
def search_patients(
    query: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for patients by name, email, or ID (Staff/Doctor Only)"""
    ensure_walkin_access(current_user, allow_doctor=True)

    search_term = f"%{query}%"
    patients = db.query(User).filter(
        User.role == UserRole.PATIENT,
        or_(
            User.fname.ilike(search_term),
            User.lname.ilike(search_term),
            User.email.ilike(search_term),
            User.contact_number.ilike(search_term)
        )
    ).limit(20).all()

    return [
        {
            "id": p.id,
            "name": f"{p.fname} {p.lname}",
            "email": p.email,
            "dob": p.dob,
            "picture": p.picture
        } for p in patients
    ]

@router.post("/book", response_model=dict)
async def quick_book_walkin(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quickly book a walk-in patient (Staff Only)"""
    ensure_walkin_access(current_user)

    if not appointment_data.patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")

    # Resolve the target Doctor (appointment_data.doctor_id is a user_id)
    doctor = db.query(Doctor).filter(Doctor.user_id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Walk-ins are staff-driven, so the chosen date/time is honored as-is (custom booking)
    # rather than being constrained to the doctor's published availability slots.
    appt_dt = appointment_data.appointment_date or datetime.utcnow()

    # Prevent double-booking: the doctor must not already have an overlapping appointment.
    if check_appointment_conflict(db, appointment_data.doctor_id, appt_dt):
        raise HTTPException(
            status_code=409,
            detail="This doctor already has an appointment at that time. Please pick another slot.",
        )

    # Create the appointment
    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=appt_dt,
        reason=appointment_data.reason,
        status=AppointmentStatus.CONFIRMED,
        appointment_type=AppointmentType.WALK_IN,
        notes=appointment_data.notes or "Walk-in consultation"
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Walk-in notification to doctor
    try:
        notif_title = "New Walk-in Appointment"
        notif_msg = f"A walk-in appointment has been booked for you."
        
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=appointment_data.doctor_id,
            title=notif_title,
            message=notif_msg,
            type="NEW_APPOINTMENT",
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        await manager.send_personal_message(
            {
                "type": "NEW_APPOINTMENT",
                "notification": {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.type,
                    "is_read": False,
                    "created_at": notification.created_at.isoformat(),
                    "appointment_id": appointment.id
                }
            },
            user_id=str(appointment_data.doctor_id)
        )
    except Exception as e:
        print(f"Error sending walk-in notification: {e}")

    return {
        "status": "success",
        "message": "Walk-in appointment created",
        "appointment_id": appointment.id
    }

@router.get("/today", response_model=List[dict])
def get_todays_walkins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Today's walk-in queue. Staff/admin see all of today's walk-ins; doctors see their own."""
    ensure_walkin_access(current_user, allow_doctor=True)

    today = datetime.utcnow().date()
    day_start = datetime.combine(today, dt_time.min)
    day_end = datetime.combine(today, dt_time.max)

    query = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.doctor))
        .filter(
            Appointment.appointment_type == AppointmentType.WALK_IN,
            Appointment.appointment_date >= day_start,
            Appointment.appointment_date <= day_end,
        )
    )

    # Doctors only see their own queue; staff/admin see the whole front-desk queue.
    if current_user.role == UserRole.DOCTOR:
        query = query.filter(Appointment.doctor_id == current_user.id)

    walkins = query.order_by(Appointment.appointment_date.asc()).all()

    return [
        {
            "id": w.id,
            "patient_id": w.patient_id,
            "patient_name": f"{w.patient.fname} {w.patient.lname}" if w.patient else "Unknown",
            "patient_picture": w.patient.picture if w.patient else None,
            "doctor_id": w.doctor_id,
            "doctor_name": f"Dr. {w.doctor.fname} {w.doctor.lname}" if w.doctor else "Unknown",
            "appointment_date": w.appointment_date.isoformat(),
            "status": w.status.value if hasattr(w.status, "value") else w.status,
            "reason": w.reason,
        }
        for w in walkins
    ]


@router.post("/register", response_model=dict)
async def register_walkin_patient(
    patient_data: WalkInPatientCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new patient from the Walk-in counter (Staff Only)"""
    ensure_walkin_access(current_user)

    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == patient_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the user
    # Walk-in patients get a default password, but should reset it later
    default_password = "WalkinUser123!"
    
    dob_parsed = None
    if patient_data.dob:
        try:
            dob_parsed = datetime.strptime(str(patient_data.dob), "%Y-%m-%d")
        except ValueError:
            pass

    new_user = User(
        email=patient_data.email,
        fname=patient_data.fname,
        lname=patient_data.lname,
        contact_number=patient_data.contact_number,
        sex=patient_data.sex,
        dob=dob_parsed,
        role=UserRole.PATIENT,
        password=get_password_hash(default_password),
        is_profile_complete=True,
        is_verified=True,  # Walk-in means physical verification
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Medical Profile
    medical_profile = MedicalProfile(user_id=new_user.id)
    db.add(medical_profile)
    db.commit()

    # Send welcome email with temporary password
    try:
        html_body = EmailService.get_appointment_template(
            action="walkin_welcome",
            user_name=f"{new_user.fname} {new_user.lname}",
            doctor_name="BukCare Staff",
            date="",
            time="",
            reason=default_password
        )
        background_tasks.add_task(
            EmailService.send_email,
            recipients=[new_user.email],
            subject="Your BukCare Account Has Been Created",
            body=html_body
        )
    except Exception as e:
        print(f"Failed to queue welcome email: {e}")

    return {
        "status": "success",
        "message": "Patient registered successfully",
        "patient": {
            "id": new_user.id,
            "name": f"{new_user.fname} {new_user.lname}",
            "email": new_user.email,
            "dob": new_user.dob,
        }
    }
