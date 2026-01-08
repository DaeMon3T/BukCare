from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date

from core.database import get_db
from models.appointment import Appointment, AppointmentStatus
from models.users import User, UserRole
from models.doctor import Doctor, DoctorAvailability
from models.notification import Notification
from routers.v1.dependencies import get_current_user
from schemas.appointment import AppointmentCreate
from utils.appointment_helpers import check_appointment_conflict, get_available_slots
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
    
    from models.doctor import Doctor 

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
    
    results = []
    for appointment in appointments:
        specialization = "General Practice"
        avatar = None

        try:
            doc_profile = db.query(Doctor).filter(Doctor.user_id == appointment.doctor_id).first()
            
            if doc_profile:
                if hasattr(doc_profile, "specializations_json") and doc_profile.specializations_json:
                    specs = doc_profile.specializations_json
                    if isinstance(specs, list):
                        specialization = ", ".join(specs)
                    else:
                        specialization = str(specs)
                elif hasattr(doc_profile, "specialization") and doc_profile.specialization:
                    specialization = doc_profile.specialization
            if appointment.doctor:
                if hasattr(appointment.doctor, "picture") and appointment.doctor.picture:
                    avatar = appointment.doctor.picture
                elif hasattr(appointment.doctor, "avatar") and appointment.doctor.avatar:
                    avatar = appointment.doctor.avatar

        except Exception as e:
            print(f"Error fetching details for appt {appointment.id}: {e}")

        results.append({
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "patient_name": f"{appointment.patient.fname} {appointment.patient.lname}",
            "doctor_id": appointment.doctor_id,
            "doctor_name": f"{appointment.doctor.fname} {appointment.doctor.lname}",
            "doctor_avatar": avatar, 
            "doctor_specialization": specialization,
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status.value,
            "notes": appointment.notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at
        })
    
    return results

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
    
    #  CHECK FOR CONFLICTS
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
        # 1. Define the Message
        notif_title = "New Appointment Request"
        notif_msg = f"Patient {current_user.fname} {current_user.lname} booked an appointment for {appointment.appointment_date.strftime('%b %d, %I:%M %p')}."
        
        # 2. Save to Database (So it shows in the "Bell" history later)
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=doctor.user_id,  # The Doctor gets the alert
            title=notif_title,
            message=notif_msg,
            type="info",
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification) # Get the ID and created_at

        # 3. Push to WebSocket (Instant "Ding" on the Doctor's screen)
        await manager.send_personal_message(
            {
                "type": "NEW_APPOINTMENT", # Frontend looks for this tag
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
            user_id=str(doctor.user_id)
        )
    except Exception as e:
        print(f"Error sending notification: {e}")
        # Pass silently so the appointment is still created even if notification fails
    
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


#  NEW ENDPOINT: Check available slots
@router.get("/available-slots/{doctor_id}")
def get_doctor_available_slots(
    doctor_id: int,
    date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available time slots based on what the DOCTOR explicitly set.
    """
    
    # A. Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # B. Fetch the Specific Slots created by the Doctor
    # We query the DoctorAvailability table for this specific date
    db_slots = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.user_id, # Use doctor.user_id as the link
        DoctorAvailability.date == date,
        DoctorAvailability.is_available == True
    ).all()

    # C. Extract the start times (e.g., "09:00:00")
    # We assume if the doctor set the slot, they want it to be bookable.
    # (Optional: You could filter out already booked appointments here if you wanted strictly unbooked slots)
    
    # Check for existing appointments to filter out duplicates or conflicts
    booked_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.user_id,
        # Check if appointment is on the same day
        Appointment.appointment_date >= datetime.combine(date, datetime.min.time()),
        Appointment.appointment_date < datetime.combine(date, datetime.max.time()),
        # Only count confirmed/pending
        Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
    ).all()

    # Create a list of booked times (HH:MM) to compare
    booked_times = [
        appt.appointment_date.strftime("%H:%M:%S") 
        for appt in booked_appointments
    ]
    
    available_slots = []
    for slot in db_slots:
        # Only add if not already booked
        # Note: This is a simple exact time match. 
        if slot.start_time not in booked_times:
             available_slots.append(slot.start_time)

    # D. Sort them nicely
    available_slots.sort()

    return {
        "doctor_id": doctor_id,
        "date": date.isoformat(),
        "available_slots": available_slots,
        "total_slots": len(available_slots)
    }


#  NEW ENDPOINT: Check if specific time is available
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

    # 🚀 REAL-TIME NOTIFICATION: Notify frontend to remove item
    try:
        msg = { "type": "APPOINTMENT_DELETED", "appointment_id": appointment_id }
        await manager.send_personal_message(msg, user_id=str(patient_id))
        await manager.send_personal_message(msg, user_id=str(doctor_id))
    except Exception as e:
        print(f"Socket error: {e}")
    
    return {"message": "Appointment permanently deleted", "deleted_id": appointment_id}

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


@router.get("/doctor", status_code=status.HTTP_200_OK)
def get_doctor_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch all appointments for the currently logged-in DOCTOR.
    """
    # 1. Security Check
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only doctors can access this dashboard."
        )

    # 2. Fetch Appointments directly using current_user.id
    # We use joinedload to prevent "Lazy Loading" errors when accessing patient data
    appointments = db.query(Appointment)\
        .options(joinedload(Appointment.patient))\
        .filter(Appointment.doctor_id == current_user.id)\
        .order_by(Appointment.appointment_date.asc())\
        .all()

    # 3. Format the data
    return [
        {
            "id": appt.id,
            # Handle case where patient relationship might be missing (safety check)
            "patient_name": f"{appt.patient.fname} {appt.patient.lname}" if appt.patient else "Unknown",
            "appointment_date": appt.appointment_date,
            "reason": appt.reason,
            "status": appt.status.value, # IMPORTANT: Use .value for Enums
            "patient_id": appt.patient_id,
            "notes": appt.notes
        }
        for appt in appointments
    ]




#  ADD THIS TO HANDLE STATUS UPDATES (Accept/Decline)
@router.put("/{appointment_id}/status", response_model=dict)
async def update_appointment_status(
    appointment_id: int,
    status_update: dict, # Expects JSON body: {"status": "confirmed"}
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get and Validate Status
    new_status_str = status_update.get("status")
    if not new_status_str:
         raise HTTPException(status_code=400, detail="Status field is required")
    
    # Validate against Enum
    valid_statuses = [s.value for s in AppointmentStatus]
    if new_status_str not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be: {', '.join(valid_statuses)}")

    # 2. Find the appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # 3. Security & Ownership Check
    is_authorized = False
    
    # Doctor Check: matches if the appointment's doctor_id is the current user's ID
    if current_user.role == UserRole.DOCTOR and appointment.doctor_id == current_user.id:
        is_authorized = True
    # Patient Check: can only cancel their own
    elif current_user.role == UserRole.PATIENT and appointment.patient_id == current_user.id:
        if new_status_str == 'cancelled':
            is_authorized = True
        else:
             raise HTTPException(status_code=403, detail="Patients can only cancel appointments")
    # Admin Check
    elif current_user.role == UserRole.ADMIN:
        is_authorized = True
        
    if not is_authorized:
         raise HTTPException(status_code=403, detail="Not authorized")

    # 4. Update Database
    appointment.status = AppointmentStatus(new_status_str)
    db.commit()
    db.refresh(appointment)
    
    # ==========================================================
    # 🔔 REAL-TIME NOTIFICATION LOGIC
    # ==========================================================
    try:
        # Determine who to notify (The "Other" person)
        target_user_id = appointment.patient_id if current_user.role == UserRole.DOCTOR else appointment.doctor_id
        
        # Create a friendly message
        action_taker = f"Dr. {current_user.lname}" if current_user.role == UserRole.DOCTOR else "The patient"
        notif_msg = f"{action_taker} has updated the appointment status to {new_status_str}."

        # 1. Save to DB History
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=target_user_id,
            title=f"Appointment {new_status_str.title()}",
            message=notif_msg,
            type="info",
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # 2. SEND SOCKET MESSAGE (This fixes the frontend update!)
        await manager.send_personal_message({
            "type": "APPOINTMENT_UPDATE",
            
            "appointment_id": appointment.id,   
            "status": new_status_str,           
            
            "notification": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "created_at": notification.created_at.isoformat()
            }
        }, user_id=str(target_user_id))

    except Exception as e:
        print(f"Socket error: {e}")

    return {"message": "Status updated", "status": new_status_str}


