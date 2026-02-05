from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.users import User, UserRole
from models.vitals import PatientVital
from schemas.vitals import VitalCreate, VitalResponse
from routers.v1.dependencies import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=VitalResponse)
def get_latest_vitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the most recent vital logs for the patient.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch the latest record (Ordered by time)
    vitals = db.query(PatientVital)\
        .filter(PatientVital.patient_id == current_user.id)\
        .order_by(PatientVital.logged_at.desc())\
        .first()
    
    if not vitals:
        # Return empty defaults if no data yet (Matches new Schema)
        return {
            "id": 0,
            "patient_id": current_user.id,
            "heart_rate": 0,
            "bp_systolic": 0,
            "bp_diastolic": 0,
            "oxygen_saturation": 0,
            "temperature": 0.0,
            "weight_kg": 0.0,
            "height_cm": 0.0,
            "bmi": 0.0,
            "logged_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    return vitals

@router.post("/", response_model=VitalResponse)
def log_vitals(
    data: VitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log new vitals. 
    - Automatically calculates BMI.
    - Creates a NEW record (History) instead of overwriting.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Auto-Calculate BMI
    # Formula: weight (kg) / [height (m)]^2
    calculated_bmi = None
    if data.weight_kg and data.height_cm and data.height_cm > 0:
        height_m = data.height_cm / 100.0
        calculated_bmi = round(data.weight_kg / (height_m ** 2), 1)

    # Create New Record
    new_vital = PatientVital(
        patient_id=current_user.id,
        heart_rate=data.heart_rate,
        bp_systolic=data.bp_systolic,
        bp_diastolic=data.bp_diastolic,
        oxygen_saturation=data.oxygen_saturation,
        temperature=data.temperature,
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        bmi=calculated_bmi
    )
    
    db.add(new_vital)
    db.commit()
    db.refresh(new_vital)
    
    return new_vital