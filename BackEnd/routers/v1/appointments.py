from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date

from core.database import get_db
from models.appointment import Appointment, AppointmentStatus
from models.users import User
from models.doctor import Doctor
from models.notification import Notification # <--- Added for History
from routers.v1.dependencies import get_current_user
from schemas.appointment import AppointmentCreate
from utils.appointment_helpers import check_appointment_conflict, get_available_slots
# 🚀 IMPORT SOCKET MANAGER
from core.socket_manager import manager 

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
async def create_appointment(
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

    # ==========================================================
    # 🚀 REAL-TIME NOTIFICATION: Notify the DOCTOR
    # ==========================================================
    try:
        # Message content
        notif_title = "New Appointment Request"
        notif_msg = f"Patient {current_user.fname} {current_user.lname} booked an appointment for {appointment.appointment_date.strftime('%b %d, %I:%M %p')}."

        # 1. Save to Database (History)
        # Note: Ensure you have a Notification model. If not, comment these 3 lines out.
        # notification = Notification(user_id=doctor.user_id, title=notif_title, message=notif_msg, type="info", appointment_id=appointment.id)
        # db.add(notification)
        # db.commit()

        # 2. Send via WebSocket (Live Alert)
        await manager.send_personal_message(
        {
            "type": "NEW_APPOINTMENT",
            "title": notif_title,
            "message": notif_msg,
            
            # 🚀 ADD THIS PAYLOAD so frontend can render it instantly
            "appointment": {
                "id": appointment.id,
                "patient_name": f"{current_user.fname} {current_user.lname}",
                "appointment_date": appointment.appointment_date.isoformat(),
                "reason": appointment.reason,
                "status": "pending",
                "notes": appointment.notes
            }
        },
        user_id=str(doctor.user_id)
    )
    except Exception as e:
        print(f"Error sending notification: {e}")
        # Don't fail the request if notification fails
    
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
async def update_appointment_status(
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
    if notes: appointment.notes = notes
    db.commit()
    db.refresh(appointment)

    try:
        # Message Data
        notif_data = {
            "type": "APPOINTMENT_UPDATE",
            "appointment_id": appointment.id,
            "status": status,
            "message": f"Appointment status updated to {status}"
        }

        # 1. Notify PATIENT
        await manager.send_personal_message(
            {**notif_data, "title": "Appointment Update"},
            user_id=str(appointment.patient_id)
        )

        # 2. Notify DOCTOR (So their other tabs/devices update instantly)
        await manager.send_personal_message(
            {**notif_data, "title": "Schedule Updated"},
            user_id=str(appointment.doctor_id)
        )

    except Exception as e:
        print(f"Socket Error: {e}")

    return { "id": appointment.id, "status": appointment.status.value, "updated_at": appointment.updated_at }

    # ==========================================================
    # 🚀 REAL-TIME NOTIFICATION: Notify the PATIENT
    # ==========================================================
    try:
        if status in ["confirmed", "cancelled", "completed"]:
            # Determine Message
            title_map = {
                "confirmed": "Appointment Confirmed ✅",
                "cancelled": "Appointment Cancelled ❌",
                "completed": "Appointment Completed 🎉"
            }
            
            doctor_name = f"Dr. {current_user.lname}" if current_user.role.value == "doctor" else "Admin"
            
            notif_msg = f"{doctor_name} has {status} your appointment on {appointment.appointment_date.strftime('%b %d')}."
            
            # 1. Send via WebSocket (Live Alert)
            await manager.send_personal_message(
                {
                    "type": "APPOINTMENT_UPDATE",
                    "title": title_map.get(status, "Appointment Update"),
                    "message": notif_msg,
                    "status": status,
                    "appointment_id": appointment.id
                },
                user_id=str(appointment.patient_id) # Send to Patient's User ID
            )
            
            # 2. Save to Database (Optional History)
            # notification = Notification(user_id=appointment.patient_id, title=title_map.get(status), message=notif_msg, type=status, appointment_id=appointment.id)
            # db.add(notification)
            # db.commit()

    except Exception as e:
        print(f"Error sending notification: {e}")

    return {
        "id": appointment.id,
        "status": appointment.status.value,
        "notes": appointment.notes,
        "updated_at": appointment.updated_at
    }

@router.delete("/{appointment_id}/permanent")
async def delete_appointment_permanently(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete an appointment from the database.
    Only completed and cancelled appointments can be deleted.
    """
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    patient_id = appointment.patient_id
    doctor_id = appointment.doctor_id
    
    # Only allow deletion of completed or cancelled appointments
    if appointment.status not in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed or cancelled appointments can be deleted"
        )
    
    # Verify user has permission to delete
    if current_user.role.value == "patient":
        if appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own appointments"
            )
    elif current_user.role.value == "doctor":
        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete appointments with your patients"
            )
    elif current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Permanently delete the appointment
    db.delete(appointment)
    db.commit()

    try:
        msg = { "type": "APPOINTMENT_DELETED", "appointment_id": appointment_id }
        await manager.send_personal_message(msg, user_id=str(patient_id))
        await manager.send_personal_message(msg, user_id=str(doctor_id))
    except Exception as e:
        print(f"Socket error: {e}")
    
    return {"message": "Deleted"}

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

@router.get("/history", response_model=dict)
def get_appointment_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (completed, cancelled)"),
    search: Optional[str] = Query(None, description="Search by patient/doctor name or reason"),
    start_date: Optional[date] = Query(None, description="Filter from this date"),
    end_date: Optional[date] = Query(None, description="Filter to this date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get appointment history with pagination and filters.
    Only shows completed and cancelled appointments.
    """
    
    # Base query with eager loading
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    )
    
    # Filter based on user role
    if current_user.role.value == "patient":
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role.value == "doctor":
        query = query.filter(Appointment.doctor_id == current_user.id)
    elif current_user.role.value == "admin":
        # Admins can see all appointment history
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Only show completed and cancelled appointments
    query = query.filter(
        Appointment.status.in_([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED])
    )
    
    # Apply status filter
    if status:
        if status not in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'completed' or 'cancelled'"
            )
        query = query.filter(Appointment.status == AppointmentStatus(status))
    
    # Apply date range filter
    if start_date:
        query = query.filter(Appointment.appointment_date >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(Appointment.appointment_date <= datetime.combine(end_date, datetime.max.time()))
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Appointment.patient.has(
                    or_(
                        User.fname.ilike(search_term),
                        User.lname.ilike(search_term)
                    )
                ),
                Appointment.doctor.has(
                    or_(
                        User.fname.ilike(search_term),
                        User.lname.ilike(search_term)
                    )
                ),
                Appointment.reason.ilike(search_term)
            )
        )
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    appointments = query.order_by(Appointment.appointment_date.desc()).offset(offset).limit(page_size).all()
    
    # Calculate pagination metadata
    total_pages = (total_count + page_size - 1) // page_size
    
    return {
        "appointments": [
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
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }