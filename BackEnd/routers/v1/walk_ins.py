from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, Integer
from typing import List, Optional
from core.database import get_db
from models.users import User, UserRole
from models.appointment import Appointment, AppointmentStatus, AppointmentType
from schemas.appointment import AppointmentCreate, AppointmentResponse
from routers.v1.dependencies import get_current_user
from datetime import datetime
from models.notification import Notification
from core.socket_manager import manager
from pydantic import BaseModel
from core.security import get_password_hash
from models.medical_profile import MedicalProfile
from models.doctor import Doctor, DoctorAvailability
from models.doctor_staff_access import DoctorStaffAccess
from sqlalchemy.orm import joinedload
from utils.email import EmailService
import json

router = APIRouter()


# ============================================
# GET AVAILABLE DOCTORS (For Walk-in Picker)
# ============================================
@router.get("/available-doctors", response_model=list)
def get_available_doctors_for_walkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all approved doctors with their specializations and availability slots."""
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Staff can only see doctors who granted them can_book_walkins access
    granted_doctor_ids = None
    if current_user.role == UserRole.STAFF:
        granted_doctor_ids = [
            a.doctor_id for a in
            db.query(DoctorStaffAccess).filter(
                DoctorStaffAccess.staff_user_id == current_user.id,
                DoctorStaffAccess.can_book_walkins == True
            ).all()
        ]
        if not granted_doctor_ids:
            return []  # No walk-in access granted

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

    # Filter by granted access if staff
    if granted_doctor_ids is not None:
        doctors = [d for d in doctors if d.user_id in granted_doctor_ids]

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
    if current_user.role not in [UserRole.STAFF, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Staff needs at least one access grant to search patients
    if current_user.role == UserRole.STAFF:
        has_any_access = db.query(DoctorStaffAccess).filter(
            DoctorStaffAccess.staff_user_id == current_user.id
        ).first()
        if not has_any_access:
            raise HTTPException(status_code=403, detail="No doctor has granted you access")

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
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only staff can book walk-ins")

    # Staff needs can_book_walkins access for the target doctor
    if current_user.role == UserRole.STAFF:
        access = db.query(DoctorStaffAccess).filter(
            DoctorStaffAccess.staff_user_id == current_user.id,
            DoctorStaffAccess.doctor_id == appointment_data.doctor_id,
            DoctorStaffAccess.can_book_walkins == True
        ).first()
        if not access:
            raise HTTPException(status_code=403, detail="You don't have walk-in booking access for this doctor")

    if not appointment_data.patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")

    # Create the appointment
    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=appointment_data.appointment_date or datetime.utcnow(),
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

@router.post("/register", response_model=dict)
async def register_walkin_patient(
    patient_data: WalkInPatientCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new patient from the Walk-in counter (Staff Only)"""
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only staff can register walk-in patients")

    # Staff needs can_register_patients access from at least one doctor
    if current_user.role == UserRole.STAFF:
        has_register_access = db.query(DoctorStaffAccess).filter(
            DoctorStaffAccess.staff_user_id == current_user.id,
            DoctorStaffAccess.can_register_patients == True
        ).first()
        if not has_register_access:
            raise HTTPException(status_code=403, detail="No doctor has granted you patient registration access")

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
