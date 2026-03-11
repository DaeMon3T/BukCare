from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from models.review import Review
from models.users import User
from models.doctor import Doctor  
from models.appointment import Appointment, AppointmentStatus 
from routers.v1.dependencies import get_current_user

router = APIRouter()

# --- SCHEMAS ---
class ReviewCreate(BaseModel):
    doctor_id: int
    rating: int
    comment: Optional[str] = None
    appointment_id: int 

class ReviewOut(BaseModel):
    id: int
    doctor_id: int
    patient_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime
    patient: Optional[dict] = None 

    class Config:
        orm_mode = True

# --- ENDPOINTS ---

# Mag post ug Review (Verified Patients Only)
@router.post("/", response_model=ReviewOut)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value != "patient":
        raise HTTPException(status_code=403, detail="Only patients can review doctors")

    # ==========================================================
    # SECURITY: Verify this is a REAL, COMPLETED appointment
    # ==========================================================
    appointment = db.query(Appointment).filter(
        Appointment.id == review.appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment record not found")

    # Ownership Check: Did YOU book this?
    if appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review your own appointments")

    # Status Check: Is it actually done?
    if appointment.status != AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="You can only review completed appointments")

    # Doctor Check
    if appointment.doctor_id != review.doctor_id:
        # Optional: You could raise error here if IDs don't match, 
        # but for now we trust the appointment ID's doctor.
        pass 

    # DUPLICATE CHECK (ACTIVATED)
    # This prevents the user from spamming reviews for the same visit
    existing_review = db.query(Review).filter(Review.appointment_id == review.appointment_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this appointment")

    # Save the review
    new_review = Review(
        doctor_id=appointment.doctor_id, 
        patient_id=current_user.id,
        rating=review.rating,
        comment=review.comment,
        
        appointment_id=review.appointment_id 
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return {
        "id": new_review.id,
        "doctor_id": new_review.doctor_id,
        "patient_name": f"{current_user.fname} {current_user.lname}",
        "rating": new_review.rating,
        "comment": new_review.comment,
        "created_at": new_review.created_at,
        "patient": {"fname": current_user.fname, "lname": current_user.lname}
    }

# 2. Get Reviews for a Specific Doctor
@router.get("/{doctor_id}", response_model=List[ReviewOut])
def get_doctor_reviews(doctor_id: int, db: Session = Depends(get_db)):
    """
    Fetch reviews for a doctor.
    Handles the translation from Doctor Profile ID to User ID.
    """
    
    # A. First, try to find the doctor using the Profile ID
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    target_user_id = doctor_id # Default fallback

    if doctor:
        # B. If found, use the REAL User ID
        target_user_id = doctor.user_id

    # Query reviews using the correct ID
    reviews = db.query(Review).options(joinedload(Review.patient))\
        .filter(Review.doctor_id == target_user_id)\
        .order_by(Review.created_at.desc())\
        .all()
    
    return [
        {
            "id": r.id,
            "doctor_id": r.doctor_id,
            "patient_name": f"{r.patient.fname} {r.patient.lname}" if r.patient else "Verified Patient",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "patient": {
                "fname": r.patient.fname, 
                "lname": r.patient.lname
            } if r.patient else None
        }
        for r in reviews
    ]