from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from models.review import Review
from models.users import User
from routers.v1.dependencies import get_current_user

router = APIRouter()

# --- SCHEMAS ---
class ReviewCreate(BaseModel):
    doctor_id: int
    rating: int
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    doctor_id: int
    patient_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

# --- ENDPOINTS ---

# 1. Post a Review (Patients Only)
@router.post("/", response_model=ReviewOut)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can review doctors")

    # Prevent reviewing yourself (if testing with same account)
    if review.doctor_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review yourself")

    new_review = Review(
        doctor_id=review.doctor_id,
        patient_id=current_user.id,
        rating=review.rating,
        comment=review.comment
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
        "created_at": new_review.created_at
    }

# 2. Get Reviews for a Specific Doctor
@router.get("/{doctor_id}", response_model=List[ReviewOut])
def get_doctor_reviews(doctor_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).options(joinedload(Review.patient)).filter(Review.doctor_id == doctor_id).order_by(Review.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "doctor_id": r.doctor_id,
            "patient_name": f"{r.patient.fname} {r.patient.lname}" if r.patient else "Anonymous",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at
        }
        for r in reviews
    ]