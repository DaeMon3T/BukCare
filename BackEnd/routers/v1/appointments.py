from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from models.appointment import Appointment  # adjust if your model name differs

router = APIRouter()

@router.get("/")
def get_appointments(db: Session = Depends(get_db)):
    """
    Fetch all appointments
    """
    return db.query(Appointment).all()

@router.post("/")
def create_appointment(appointment: Appointment, db: Session = Depends(get_db)):
    """
    Create a new appointment
    """
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment
