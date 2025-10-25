from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db
from models.appointment import Appointment, AppointmentStatus
from models.users import User
from routers.v1.dependencies import get_current_user

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
    query = db.query(Appointment)
    
    # Filter based on user role
    if current_user.role.value == "patient":
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role.value == "doctor":
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
            "doctor_id": appointment.doctor_id,
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
    doctor_id: int,
    appointment_date: datetime,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment (patients only)"""
    if current_user.role.value != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create appointments"
        )
    
    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor_id,
        appointment_date=appointment_date,
        reason=reason,
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
    
    # Verify doctor can only update their own appointments
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
    if (current_user.role.value == "patient" and appointment.patient_id != current_user.id) or \
       (current_user.role.value == "doctor" and appointment.doctor_id != current_user.id):
        if current_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own appointments"
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
    from datetime import datetime
    
    if current_user.role.value == "patient":
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == current_user.id,
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_(["confirmed", "pending"])
        ).order_by(Appointment.appointment_date).all()
    elif current_user.role.value == "doctor":
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_(["confirmed", "pending"])
        ).order_by(Appointment.appointment_date).all()
    else:
        # Admin can see all upcoming appointments
        appointments = db.query(Appointment).filter(
            Appointment.appointment_date > datetime.utcnow(),
            Appointment.status.in_(["confirmed", "pending"])
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
    from datetime import datetime
    
    if current_user.role.value == "patient":
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == current_user.id,
            Appointment.appointment_date < datetime.utcnow()
        ).order_by(Appointment.appointment_date.desc()).all()
    elif current_user.role.value == "doctor":
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date < datetime.utcnow()
        ).order_by(Appointment.appointment_date.desc()).all()
    else:
        # Admin can see all appointment history
        appointments = db.query(Appointment).filter(
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
