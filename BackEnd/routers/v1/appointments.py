from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date, time
from pydantic import BaseModel 
import models
from models.message import Message 
from core.database import get_db
from models.appointment import Appointment, AppointmentStatus
from models.users import User, UserRole
from models.doctor import Doctor, DoctorAvailability
from models.notification import Notification
from routers.v1.dependencies import get_current_user
from schemas.appointment import AppointmentCreate, AppointmentUpdate, RescheduleRequest
from utils.appointment_helpers import check_appointment_conflict, get_available_slots
from core.socket_manager import manager
from utils.email import EmailService

router = APIRouter()

# ----------------------------------------------------
# 1. NEW SCHEMA FOR RESCHEDULE
# ----------------------------------------------------
class RescheduleRequest(BaseModel):
    new_date: date
    new_time: time
    reason: Optional[str] = None

# ----------------------------------------------------
# EXISTING ENDPOINTS (UNCHANGED LOGIC)
# ----------------------------------------------------

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
    from models.review import Review

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

        # --- CHECK IF REVIEW EXISTS ---
        has_reviewed = False
        try:
            # Check if there is a review linked to this appointment ID
            # Assuming your Review model has an 'appointment_id' column
            existing_review = db.query(Review).filter(
                Review.appointment_id == appointment.id
            ).first()
            
            if existing_review:
                has_reviewed = True
                
        except Exception as e:
            print(f"Error checking review status: {e}")
        # --------------------------------------------

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
            "updated_at": appointment.updated_at,
            "has_reviewed": has_reviewed 
        })
    
    return results

@router.post("/", response_model=dict)
async def create_appointment(
    appointment_data: AppointmentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new appointment.
    - Patients: Create PENDING request for themselves.
    - Doctors: Create CONFIRMED follow-up for a specific patient.
    """
    
    # SETUP VARIABLES BASED ON ROLE
    target_patient_id = None
    target_doctor_id = None
    initial_status = AppointmentStatus.PENDING
    
    if current_user.role.value == "patient":
        target_patient_id = current_user.id
        # Fix: Ensure we find the doctor correctly
        doctor_obj = db.query(Doctor).filter(Doctor.doctor_id == appointment_data.doctor_id).first()
        if not doctor_obj:
             doctor_obj = db.query(Doctor).filter(Doctor.user_id == appointment_data.doctor_id).first()
             
        if not doctor_obj:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
        target_doctor_id = doctor_obj.user_id
        initial_status = AppointmentStatus.PENDING # Needs approval
        
    # DOCTOR BOOKING (Follow-Up)
    elif current_user.role.value == "doctor":
        if not appointment_data.patient_id:
             raise HTTPException(status_code=400, detail="Patient ID is required for doctor-initiated bookings.")
        
        target_patient_id = appointment_data.patient_id
        target_doctor_id = current_user.id # Doctor books for themselves
        initial_status = AppointmentStatus.CONFIRMED # Auto-approved
        
    else:
        raise HTTPException(status_code=403, detail="Not authorized to create appointments")

    # VALIDATE DOCTOR EXISTS
    doctor_check = db.query(Doctor).filter(Doctor.user_id == target_doctor_id).first()
    if not doctor_check:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # CHECK FOR CONFLICTS
    has_conflict = check_appointment_conflict(
        db=db,
        doctor_id=target_doctor_id,
        appointment_date=appointment_data.appointment_date,
        duration_minutes=60 
    )
    
    if has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked."
        )

    # CREATE APPOINTMENT
    appointment = Appointment(
        patient_id=target_patient_id,
        doctor_id=target_doctor_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status=initial_status,
        notes=appointment_data.notes or ("Follow-up booked by doctor" if current_user.role.value == "doctor" else None)
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # ==========================================================
    # REAL-TIME NOTIFICATION (WebSocket)
    # ==========================================================
    try:
        # Determine who gets the notification
        if current_user.role.value == "patient":
            notify_target_id = target_doctor_id
            notif_title = "New Appointment Request"
            notif_msg = f"Patient {current_user.fname} {current_user.lname} booked an appointment for {appointment.appointment_date.strftime('%b %d, %I:%M %p')}."
        else:
            notify_target_id = target_patient_id
            notif_title = "New Appointment Scheduled"
            notif_msg = f"Dr. {current_user.lname} scheduled an appointment for you on {appointment.appointment_date.strftime('%b %d, %I:%M %p')}."

        # Save Notification to DB
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=notify_target_id,
            title=notif_title,
            message=notif_msg,
            type="NEW_APPOINTMENT", # Use specific type for better frontend handling
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Send WebSocket
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
            user_id=str(notify_target_id)
        )
    except Exception as e:
        print(f"Error sending WebSocket notification: {e}")

    # ==========================================================
    # EMAIL NOTIFICATION (Background Task)
    # ==========================================================
    try:
        # Fetch User Objects for Email Data
        patient_user = db.query(User).filter(User.id == target_patient_id).first()
        doctor_user = db.query(User).filter(User.id == target_doctor_id).first()

        if patient_user and doctor_user:
            if current_user.role.value == "patient" and doctor_user.email:
                email_body = EmailService.get_appointment_template(
                    action="request",
                    user_name=f"{patient_user.fname} {patient_user.lname}",
                    doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                    date=appointment.appointment_date.strftime("%B %d, %Y"),
                    time=appointment.appointment_date.strftime("%I:%M %p"),
                    reason=appointment.reason
                )
                background_tasks.add_task(
                    EmailService.send_email,
                    recipients=[doctor_user.email],
                    subject="New Appointment Request - BukCare",
                    body=email_body
                )

            elif current_user.role.value == "doctor" and patient_user.email:
                email_body = EmailService.get_appointment_template(
                    action="approved", 
                    user_name=f"{patient_user.fname} {patient_user.lname}",
                    doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                    date=appointment.appointment_date.strftime("%B %d, %Y"),
                    time=appointment.appointment_date.strftime("%I:%M %p"),
                    reason=appointment.reason
                )
                background_tasks.add_task(
                    EmailService.send_email,
                    recipients=[patient_user.email],
                    subject="Appointment Scheduled - BukCare",
                    body=email_body
                )

    except Exception as e:
        print(f"Error queuing email: {e}")
    
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


# Check available slots
@router.get("/available-slots/{doctor_id}")
def get_doctor_available_slots(
    doctor_id: int,
    date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available time slots based on what the DOCTOR explicitly set.
    """
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Fetch the Specific Slots created by the Doctor
    # We query the DoctorAvailability table for this specific date
    db_slots = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor.user_id, # Use doctor.user_id as the link
        DoctorAvailability.date == date,
        DoctorAvailability.is_available == True
    ).all()

    # Extract the start times (e.g., "09:00:00")
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
        if slot.start_time.strftime("%H:%M:%S") not in booked_times:
             available_slots.append(slot.start_time)

    # Sort them nicely
    available_slots.sort()

    return {
        "doctor_id": doctor_id,
        "date": date.isoformat(),
        "available_slots": available_slots,
        "total_slots": len(available_slots)
    }


# Check if specific time is available
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
    Permanently delete an appointment.
    Safety: Unlinks related Messages and Notifications first to prevent DB errors.
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
            raise HTTPException(status_code=403, detail="You can only delete your own appointments")
    elif current_user.role.value == "doctor":
        if appointment.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete appointments with your patients")
    elif current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Unlink Messages (Set appointment_id to NULL)
    linked_messages = db.query(Message).filter(Message.appointment_id == appointment_id).all()
    for msg in linked_messages:
        msg.appointment_id = None
        # Optional: Add a note so users know why the link is gone
        # msg.content += " (Appointment deleted)" 

    # Unlink Notifications (Set appointment_id to NULL)
    linked_notifs = db.query(Notification).filter(Notification.appointment_id == appointment_id).all()
    for notif in linked_notifs:
        notif.appointment_id = None

    # Save these changes FIRST so the database is happy
    db.commit()
    
    # Now safely delete the appointment
    db.delete(appointment)
    db.commit()

    # REAL-TIME NOTIFICATION
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
    # Security Check
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only doctors can access this dashboard."
        )

    # Fetch Appointments directly using current_user.id
    # We use joinedload to prevent "Lazy Loading" errors when accessing patient data
    appointments = db.query(Appointment)\
        .options(joinedload(Appointment.patient))\
        .filter(Appointment.doctor_id == current_user.id)\
        .order_by(Appointment.appointment_date.asc())\
        .all()

    # Format the data
    return [
        {
            "id": appt.id,
            "patient_name": f"{appt.patient.fname} {appt.patient.lname}" if appt.patient else "Unknown",
            "appointment_date": appt.appointment_date,
            "reason": appt.reason,
            "status": appt.status.value,
            "patient_id": appt.patient_id,
            "notes": appt.notes,
            "patient_avatar": appt.patient.picture if appt.patient and hasattr(appt.patient, "picture") else None
        }
        for appt in appointments
    ]


@router.put("/{appointment_id}/status", response_model=dict)
async def update_appointment_status(
    appointment_id: int,
    status_update: dict, # Expects: {"status": "cancelled", "reason": "Doctor has an emergency"}
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate Status
    new_status_str = status_update.get("status")
    cancellation_reason = status_update.get("reason")

    if not new_status_str:
         raise HTTPException(status_code=400, detail="Status field is required")
    
    valid_statuses = [s.value for s in AppointmentStatus]
    if new_status_str not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be: {', '.join(valid_statuses)}")

    # FORCE REASON FOR CANCELLATION
    if new_status_str == "cancelled" and not cancellation_reason:
        raise HTTPException(status_code=400, detail="A reason is required to cancel an appointment.")

    # Find Appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Security Check
    is_authorized = False
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role

    if user_role == "doctor" and appointment.doctor_id == current_user.id:
        is_authorized = True
    elif user_role == "patient" and appointment.patient_id == current_user.id:
        if new_status_str == 'cancelled':
            is_authorized = True
        else:
             raise HTTPException(status_code=403, detail="Patients can only cancel appointments")
    elif user_role == "admin":
        is_authorized = True
        
    if not is_authorized:
         raise HTTPException(status_code=403, detail="Not authorized")

    # 5. Update Database
    appointment.status = AppointmentStatus(new_status_str)
    
    # If cancelled, add the reason to the notes so it's saved in history
    if new_status_str == "cancelled" and cancellation_reason:
        old_notes = appointment.notes or ""
        timestamp = datetime.now().strftime("%Y-%m-%d")
        appointment.notes = f"{old_notes}\n[Cancelled on {timestamp}]: {cancellation_reason}".strip()

    db.commit()
    db.refresh(appointment)

    # ==========================================================
    # REAL-TIME & EMAIL LOGIC
    # ==========================================================
    try:
        target_user_id = appointment.patient_id if user_role == "doctor" else appointment.doctor_id
        action_taker = f"Dr. {current_user.lname}" if user_role == "doctor" else "The patient"
        
        # Customize notification message
        if new_status_str == "cancelled":
            notif_msg = f"{action_taker} cancelled the appointment. Reason: {cancellation_reason}"
        else:
            notif_msg = f"{action_taker} has updated the appointment status to {new_status_str}."

        # Save Notification
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=target_user_id,
            title=f"Appointment {new_status_str.title()}",
            message=notif_msg,
            type="APPOINTMENT_UPDATE",
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()
        
        # WebSocket
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

        # EMAIL LOGIC
        patient_user = db.query(User).filter(User.id == appointment.patient_id).first()
        doctor_user = db.query(User).filter(User.id == appointment.doctor_id).first()

        if patient_user and doctor_user:
            action_map = {
                "confirmed": "approved",
                "cancelled": "cancelled",
                "completed": "completed"
            }
            email_action = action_map.get(new_status_str, "")

            if email_action:
                # Logic for Reason Display in Email
                # If cancelled, show the Cancellation Reason. 
                # Otherwise, show the original Medical Reason.
                email_reason = cancellation_reason if new_status_str == "cancelled" else appointment.reason

                # Doctor -> Patient
                if user_role == "doctor" and patient_user.email:
                    html_body = EmailService.get_appointment_template(
                        action=email_action,
                        user_name=f"{patient_user.fname} {patient_user.lname}",
                        doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                        date=appointment.appointment_date.strftime("%B %d, %Y"),
                        time=appointment.appointment_date.strftime("%I:%M %p"),
                        reason=email_reason
                    )
                    background_tasks.add_task(
                        EmailService.send_email,
                        recipients=[patient_user.email],
                        subject=f"Appointment Update: {new_status_str.title()} - BukCare",
                        body=html_body
                    )
                
                # Patient -> Doctor
                elif user_role == "patient" and new_status_str == "cancelled" and doctor_user.email:
                    html_body = EmailService.get_appointment_template(
                        action="cancelled",
                        user_name=f"Dr. {doctor_user.lname}",
                        doctor_name=f"{patient_user.fname} {patient_user.lname}",
                        date=appointment.appointment_date.strftime("%B %d, %Y"),
                        time=appointment.appointment_date.strftime("%I:%M %p"),
                        reason=f"Patient Reason: {cancellation_reason}"
                    )
                    background_tasks.add_task(
                        EmailService.send_email,
                        recipients=[doctor_user.email],
                        subject="Appointment Cancelled by Patient - BukCare",
                        body=html_body
                    )

    except Exception as e:
        print(f"Notification Error (Non-blocking): {e}")

    return {"message": "Status updated", "status": new_status_str}


# ----------------------------------------------------
# THE UNIVERSAL RESCHEDULE ENDPOINT (MERGED)
# ----------------------------------------------------
@router.put("/{appointment_id}/reschedule", response_model=dict)
async def reschedule_appointment(
    appointment_id: int,
    request: RescheduleRequest, # 👈 Using the direct import
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"\n>>> DEBUG: RESCHEDULE REQUEST for ID {appointment_id}")

    # 1. Fetch Appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # 2. Authorization Check
    # Only the Patient owning the appt OR the Doctor assigned to it can reschedule
    if appointment.patient_id != current_user.id and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reschedule this appointment")

    # 3. Availability Check
    new_datetime = datetime.combine(request.new_date, request.new_time)
    
    # Check for conflicts (excluding current appointment)
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == new_datetime,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        Appointment.id != appointment_id
    ).first()

    if conflict:
        raise HTTPException(status_code=409, detail="This time slot is already booked.")

    # 4. Determine New Status & Update DB
    is_doctor = (current_user.id == appointment.doctor_id)
    
    if is_doctor:
        # Doctor moved it -> Keep CONFIRMED
        appointment.status = AppointmentStatus.CONFIRMED
        target_user_id = appointment.patient_id
        notification_msg = f"Dr. {current_user.lname} rescheduled your appointment to {request.new_date} at {request.new_time}."
    else:
        # Patient moved it -> Reset to PENDING
        appointment.status = AppointmentStatus.PENDING
        target_user_id = appointment.doctor_id
        notification_msg = f"Patient {current_user.fname} requested to reschedule to {request.new_date} at {request.new_time}."

    # Update Fields
    appointment.appointment_date = new_datetime
    history_note = f"\n[Rescheduled by {'Doctor' if is_doctor else 'Patient'}]: {request.reason or 'No reason provided'}"
    appointment.notes = (appointment.notes or "") + history_note
    appointment.updated_at = datetime.now()

    db.commit()
    db.refresh(appointment)
    print(">>> DEBUG: Database Updated")

    # ==========================================================
    # 🔔 REAL-TIME & EMAIL LOGIC
    # ==========================================================
    try:
        # Save Notification
        notification = Notification(
            source_user_id=current_user.id,
            target_user_id=target_user_id,
            title="Appointment Rescheduled",
            message=notification_msg,
            type="APPOINTMENT_UPDATE",
            appointment_id=appointment.id
        )
        db.add(notification)
        db.commit()

        # Send WebSocket
        await manager.send_personal_message(
            {
                "type": "APPOINTMENT_UPDATE",
                "appointment_id": appointment.id,
                "status": appointment.status.value,
                "new_date": str(request.new_date),
                "new_time": str(request.new_time),
                "notification": {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "created_at": notification.created_at.isoformat()
                }
            },
            user_id=str(target_user_id)
        )
        print(">>> DEBUG: WebSocket Sent")

        # 📧 EMAIL LOGIC
        patient_user = db.query(User).filter(User.id == appointment.patient_id).first()
        doctor_user = db.query(User).filter(User.id == appointment.doctor_id).first()

        if patient_user and doctor_user:
            # CASE A: Doctor Rescheduled -> Email Patient
            if is_doctor and patient_user.email:
                html_body = EmailService.get_appointment_template(
                    action="rescheduled",
                    user_name=f"{patient_user.fname} {patient_user.lname}",
                    doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                    date=request.new_date.strftime("%B %d, %Y"),
                    time=request.new_time.strftime("%I:%M %p"),
                    reason=request.reason
                )
                background_tasks.add_task(
                    EmailService.send_email,
                    recipients=[patient_user.email],
                    subject="Appointment Rescheduled - BukCare",
                    body=html_body
                )
            
            # Patient Requested -> Email Doctor
            elif not is_doctor and doctor_user.email:
                html_body = EmailService.get_appointment_template(
                    action="request", 
                    user_name=f"{patient_user.fname} {patient_user.lname}",
                    doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                    date=request.new_date.strftime("%B %d, %Y"),
                    time=request.new_time.strftime("%I:%M %p"),
                    reason=f"Reschedule Request: {request.reason}"
                )
                background_tasks.add_task(
                    EmailService.send_email,
                    recipients=[doctor_user.email],
                    subject="Reschedule Request - BukCare",
                    body=html_body
                )
        print(">>> DEBUG: Email Queued")

    except Exception as e:
        print(f"!!! DEBUG Notification/Email Error: {e}")
        # Fix ang crash sa yawa nga email or notification errors

    return {
        "id": appointment.id,
        "status": appointment.status.value,
        "appointment_date": appointment.appointment_date,
        "message": "Rescheduled successfully"
    }