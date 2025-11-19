# utils/appointment_helpers.py
from sqlalchemy.orm import Session
from models.appointment import Appointment, AppointmentStatus
from datetime import datetime, timedelta
from typing import Optional


def check_appointment_conflict(
    db: Session,
    doctor_id: int,
    appointment_date: datetime,
    duration_minutes: int = 60,
    exclude_appointment_id: Optional[int] = None
) -> bool:
    """
    Check if there's a conflicting appointment for a doctor at the given time.
    
    Args:
        db: Database session
        doctor_id: Doctor's user ID
        appointment_date: Start time of the appointment
        duration_minutes: Duration of the appointment (default 60 minutes)
        exclude_appointment_id: Appointment ID to exclude (for rescheduling)
    
    Returns:
        True if there's a conflict, False otherwise
    """
    end_time = appointment_date + timedelta(minutes=duration_minutes)
    
    # Query for overlapping appointments
    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
        ]),
        # Check for overlapping time ranges
        Appointment.appointment_date < end_time,
        # Assuming appointments are 1 hour by default
        # You might want to add an end_time column later
    )
    
    # Exclude current appointment if rescheduling
    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)
    
    conflicting_appointments = query.all()
    
    # Check if any appointment overlaps
    for appt in conflicting_appointments:
        appt_end = appt.appointment_date + timedelta(minutes=duration_minutes)
        # Check if times overlap
        if appointment_date < appt_end and end_time > appt.appointment_date:
            return True
    
    return False


def get_available_slots(
    db: Session,
    doctor_id: int,
    date: datetime.date,
    start_hour: int = 8,
    end_hour: int = 17,
    slot_duration: int = 60
) -> list:
    """
    Get available time slots for a doctor on a specific date.
    
    Args:
        db: Database session
        doctor_id: Doctor's user ID
        date: Date to check
        start_hour: Start of working hours (default 8 AM)
        end_hour: End of working hours (default 5 PM)
        slot_duration: Duration of each slot in minutes (default 60)
    
    Returns:
        List of available datetime slots
    """
    available_slots = []
    current_time = datetime.combine(date, datetime.min.time().replace(hour=start_hour))
    end_time = datetime.combine(date, datetime.min.time().replace(hour=end_hour))
    
    while current_time < end_time:
        # Check if this slot is available
        if not check_appointment_conflict(db, doctor_id, current_time, slot_duration):
            available_slots.append(current_time)
        
        # Move to next slot
        current_time += timedelta(minutes=slot_duration)
    
    return available_slots