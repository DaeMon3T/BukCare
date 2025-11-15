from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from core.database import get_db
from models.doctor import DoctorAvailability, Doctor
from models.users import User
from routers.v1.dependencies import get_current_user
from schemas.schedules import ScheduleCreate, ScheduleResponse


router = APIRouter()


# --- ✅ Create Pydantic model for request body ---
class ScheduleCreate(BaseModel):
    doctor_id: int
    date: date
    start_time: str
    end_time: str
    is_available: bool = True
    notes: Optional[str] = None


@router.get("/", response_model=List[ScheduleResponse])
def get_doctor_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get schedules for the current doctor"""
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view schedules")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    schedules = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.doctor_id == doctor.doctor_id)
        .order_by(DoctorAvailability.date.desc())
        .all()
    )
    return schedules



@router.post("/", response_model=dict)
def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new schedule entry (doctors only)"""
    if current_user.role.value != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create schedules",
        )

    # Automatically find the doctor's profile by user_id
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found",
        )

    schedule = DoctorAvailability(
        doctor_id=doctor.doctor_id,  # ✅ automatically use linked doctor_id
        date=schedule_data.date,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        is_available=schedule_data.is_available,
        notes=schedule_data.notes,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "id": schedule.id,
        "doctor_id": schedule.doctor_id,
        "date": schedule.date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "is_available": schedule.is_available,
        "notes": schedule.notes,
    }



@router.put("/{schedule_id}", response_model=dict)
def update_schedule(
    schedule_id: int,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    is_available: Optional[bool] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a schedule entry"""
    schedule = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.doctor_id == schedule.doctor_id,
            Doctor.user_id == current_user.id,
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own schedules",
        )

    if start_time is not None:
        schedule.start_time = start_time
    if end_time is not None:
        schedule.end_time = end_time
    if is_available is not None:
        schedule.is_available = is_available
    if notes is not None:
        schedule.notes = notes

    db.commit()
    db.refresh(schedule)

    return {
        "id": schedule.id,
        "doctor_id": schedule.doctor_id,
        "date": schedule.date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "is_available": schedule.is_available,
        "notes": schedule.notes,
    }


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a schedule entry"""
    schedule = (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.doctor_id == schedule.doctor_id,
            Doctor.user_id == current_user.id,
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own schedules",
        )

    db.delete(schedule)
    db.commit()

    return {"message": "Schedule deleted successfully"}


@router.get("/doctor/{doctor_id}/available-slots")
def get_available_slots(
    doctor_id: int,
    date: str,
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor on a specific date"""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    availabilities = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor_id,
            DoctorAvailability.date == target_date,
            DoctorAvailability.is_available == True,
        )
        .all()
    )

    from models.appointment import Appointment

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date >= datetime.combine(
                target_date, datetime.min.time()
            ),
            Appointment.appointment_date
            < datetime.combine(target_date, datetime.min.time())
            + timedelta(days=1),
            Appointment.status.in_(["confirmed", "pending"]),
        )
        .all()
    )

    available_slots = []
    for a in availabilities:
        current_time = datetime.combine(target_date, a.start_time)
        end_datetime = datetime.combine(target_date, a.end_time)

        while current_time < end_datetime:
            slot_end = current_time + timedelta(minutes=30)
            is_booked = any(
                apt.appointment_date <= current_time
                < apt.appointment_date + timedelta(minutes=30)
                for apt in appointments
            )
            if not is_booked:
                available_slots.append(
                    {
                        "start_time": current_time.strftime("%H:%M"),
                        "end_time": slot_end.strftime("%H:%M"),
                        "datetime": current_time.isoformat(),
                    }
                )
            current_time += timedelta(minutes=30)

    return {
        "doctor_id": doctor_id,
        "date": date,
        "available_slots": available_slots,
    }
