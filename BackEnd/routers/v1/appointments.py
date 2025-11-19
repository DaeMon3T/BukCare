from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date

from core.database import get_db
from models.appointment import Appointment, AppointmentStatus
from models.users import User
from models.doctor import Doctor
from routers.v1.dependencies import get_current_user
from schemas.appointment import AppointmentCreate
from utils.appointment_helpers import check_appointment_conflict, get_available_slots

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_appointments(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments with optional filtering"""
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    )
    
    # Filter based on user role
    if current_user.role.value == "patient":
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role.value == "doctor":
        # ✅ FIXED: doctor_id already points to users.id
        query = query.filter(Appointment.doctor_id == current_user.id)
    elif current_user.role.value == "admin":
        # Admins can see all appointments
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Apply additional filters
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    
    return [
        {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "patient_name": f"{appointment.patient.fname} {appointment.patient.lname}",
            "doctor_id": appointment.doctor_id,
            "doctor_name": f"{appointment.doctor.fname} {appointment.doctor.lname}",
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status.value,
            "notes": appointment.notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at
        }
        for appointment in appointments
    ]

@router.post("/", response_model=dict)
def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment (patients only) with conflict prevention"""
    if current_user.role.value != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create appointments"
        )
    
    # Get the doctor record
    doctor = db.query(Doctor).filter(Doctor.doctor_id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # ✅ CHECK FOR CONFLICTS
    has_conflict = check_appointment_conflict(
        db=db,
        doctor_id=doctor.user_id,
        appointment_date=appointment_data.appointment_date,
        duration_minutes=60  # Default 1 hour appointment
    )
    
    if has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked. Please choose another time."
        )
    
    # Create the appointment
    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.user_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status=AppointmentStatus.PENDING
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status.value,
        "notes": appointment.notes,
        "created_at": appointment.created_at
    }


# ✅ NEW ENDPOINT: Check available slots
@router.get("/available-slots/{doctor_id}")
def get_doctor_available_slots(
    doctor_id: int,
    date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor on a specific date"""
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get available slots
    slots = get_available_slots(
        db=db,
        doctor_id=doctor.user_id,
        date=date,
        start_hour=8,   # 8 AM
        end_hour=17,    # 5 PM
        slot_duration=60  # 1 hour slots
    )
    
    return {
        "doctor_id": doctor_id,
        "date": date.isoformat(),
        "available_slots": [slot.isoformat() for slot in slots],
        "total_slots": len(slots)
    }


# ✅ NEW ENDPOINT: Check if specific time is available
@router.get("/check-availability/{doctor_id}")
def check_time_availability(
    doctor_id: int,
    appointment_date: datetime = Query(..., description="Appointment date and time"),
    db: Session = Depends(get_db)
):
    """Check if a specific time slot is available for a doctor"""
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Check for conflicts
    has_conflict = check_appointment_conflict(
        db=db,
        doctor_id=doctor.user_id,
        appointment_date=appointment_date,
        duration_minutes=60
    )
    
    return {
        "doctor_id": doctor_id,
        "appointment_date": appointment_date.isoformat(),
        "is_available": not has_conflict,
        "message": "Time slot is available" if not has_conflict else "Time slot is already booked"
    }

@router.put("/{appointment_id}/status", response_model=dict)
def update_appointment_status(
    appointment_id: int,
    status: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update appointment status (doctors and admins only)"""
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can update appointment status"
        )
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # ✅ FIXED: doctor_id is already the user's id
    if current_user.role.value == "doctor" and appointment.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own appointments"
        )
    
    # Validate status
    valid_statuses = [s.value for s in AppointmentStatus]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    appointment.status = AppointmentStatus(status)
    if notes:
        appointment.notes = notes
    
    db.commit()
    db.refresh(appointment)
    
    return {
        "id": appointment.id,
        "status": appointment.status.value,
        "notes": appointment.notes,
        "updated_at": appointment.updated_at
    }

@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an appointment"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify user can only cancel their own appointments
    if current_user.role.value == "patient":
        if appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own appointments"
            )
    elif current_user.role.value == "doctor":
        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own appointments"
            )
    elif current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    
    return {"message": "Appointment cancelled successfully"}

@router.get("/upcoming")
def get_upcoming_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get upcoming appointments for the current user"""
    
    if current_user.role.value == "patient":
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.patient_id == current_user.id,
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).order_by(Appointment.appointment_date).all()
    elif current_user.role.value == "doctor":
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).order_by(Appointment.appointment_date).all()
    else:
        # Admin can see all upcoming appointments
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).order_by(Appointment.appointment_date).all()
    
    return [
        {
            "id": appointment.id,
            "patient_name": f"{appointment.patient.fname} {appointment.patient.lname}",
            "doctor_name": f"{appointment.doctor.fname} {appointment.doctor.lname}",
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status.value,
            "notes": appointment.notes
        }
        for appointment in appointments
    ]

@router.get("/history")
def get_appointment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointment history for the current user"""
    
    if current_user.role.value == "patient":
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.patient_id == current_user.id,
            Appointment.appointment_date < datetime.utcnow()
        ).order_by(Appointment.appointment_date.desc()).all()
    elif current_user.role.value == "doctor":
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date < datetime.utcnow()
        ).order_by(Appointment.appointment_date.desc()).all()
    else:
        # Admin can see all appointment history
        appointments = db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor)
        ).filter(
            Appointment.appointment_date < datetime.utcnow()
        ).order_by(Appointment.appointment_date.desc()).all()
    
    return [
        {
            "id": appointment.id,
            "patient_name": f"{appointment.patient.fname} {appointment.patient.lname}",
            "doctor_name": f"{appointment.doctor.fname} {appointment.doctor.lname}",
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status.value,
            "notes": appointment.notes
        }
        for appointment in appointments
    ]