from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, Integer
from typing import List, Optional
from core.database import get_db
from models.users import User, UserRole
from models.appointment import Appointment, AppointmentStatus, AppointmentType
from schemas.appointment import AppointmentCreate, AppointmentResponse
from routers.v1.dependencies import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/patients/search", response_model=List[dict])
def search_patients(
    query: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for patients by name, email, or ID (Staff/Doctor Only)"""
    if current_user.role not in [UserRole.STAFF, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    search_term = f"%{query}%"
    patients = db.query(User).filter(
        User.role == UserRole.PATIENT,
        or_(
            User.fname.ilike(search_term),
            User.lname.ilike(search_term),
            User.email.ilike(search_term)
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

    if not appointment_data.patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")

    # Create the appointment
    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=datetime.utcnow(), # Walk-ins are usually immediate
        reason=appointment_data.reason,
        status=AppointmentStatus.CONFIRMED, # Auto-confirmed by staff
        appointment_type=AppointmentType.WALK_IN,
        notes=appointment_data.notes or "Walk-in consultation"
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "status": "success",
        "message": "Walk-in appointment created",
        "appointment_id": appointment.id
    }
