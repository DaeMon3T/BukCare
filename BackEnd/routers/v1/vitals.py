from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.users import User, UserRole
from models.vitals import PatientVital
from schemas.vitals import VitalUpdate, VitalResponse
from routers.v1.dependencies import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=VitalResponse)
def get_my_vitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    vitals = db.query(PatientVital).filter(PatientVital.patient_id == current_user.id).first()
    
    if not vitals:
        # Return empty defaults if no data yet
        return {
            "heart_rate": 0,
            "weight": 0,
            "blood_pressure": "0/0",
            "sleep_hours": 0,
            "updated_at": datetime.utcnow()
        }
    return vitals

@router.post("/", response_model=VitalResponse)
def update_my_vitals(
    data: VitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    vitals = db.query(PatientVital).filter(PatientVital.patient_id == current_user.id).first()
    
    if not vitals:
        # Create new record
        vitals = PatientVital(patient_id=current_user.id, **data.model_dump())
        db.add(vitals)
    else:
        # Update existing record
        if data.heart_rate is not None: vitals.heart_rate = data.heart_rate
        if data.weight is not None: vitals.weight = data.weight
        if data.blood_pressure is not None: vitals.blood_pressure = data.blood_pressure
        if data.sleep_hours is not None: vitals.sleep_hours = data.sleep_hours
    
    db.commit()
    db.refresh(vitals)
    return vitals