from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

import models
from core.database import get_db
from models.doctor import Doctor, DoctorAvailability
from models.users import User
from schemas.doctor import Doctor as DoctorSchema, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("/", response_model=List[DoctorSchema])
def get_doctors(
    approved: Optional[bool] = Query(None, description="Filter by doctor approval status"),
    db: Session = Depends(get_db),
):
    """
    Get all doctors with their linked user info, specialization, and location.
    Optionally filter by approval status (is_doctor_approved).
    """

    query = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.specializations),
            joinedload(Doctor.province),
            joinedload(Doctor.city),
            joinedload(Doctor.barangay),
        )
    )

    # ✅ Filter by approval (Doctor's user.is_doctor_approved)
    if approved is not None:
        query = query.join(User).filter(User.is_doctor_approved == approved)

    doctors = query.all()

    # ✅ Return empty list (avoid frontend 404 errors)
    if not doctors:
        return []

    return [
        DoctorSchema(
            doctor_id=doc.doctor_id,
            user_id=doc.user_id,
            name=f"{doc.user.fname} {doc.user.lname}",
            email=doc.user.email,
            specialization=doc.specializations[0].name if doc.specializations else "General Practice",
            license_number=doc.license_number,
            years_of_experience=doc.years_of_experience,
            address=f"{doc.barangay.name if doc.barangay else ''}, "
                    f"{doc.city.name if doc.city else ''}, "
                    f"{doc.province.name if doc.province else ''}",
            # ✅ These are correctly sourced from the User model
            is_verified=doc.user.is_verified,
            is_doctor_approved=doc.user.is_doctor_approved,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )
        for doc in doctors
    ]

# ================================
# Get single doctor by ID
# ================================
@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(models.Doctor)
        .options(
            joinedload(models.Doctor.user),
            joinedload(models.Doctor.specializations),
            joinedload(models.Doctor.availabilities),
        )
        .filter(models.Doctor.doctor_id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user = doctor.user

    # --- FIX NAME HANDLING ---
    first = getattr(user, "fname", None) or getattr(user, "first_name", "")
    last = getattr(user, "lname", None) or getattr(user, "last_name", "")
    full_name = f"{first} {last}".strip()

    # --- FIX SPECIALIZATION ---
    specialization = (
        doctor.specializations[0].name
        if doctor.specializations and len(doctor.specializations) > 0
        else "General Practice"
    )

    # --- FIX ADDRESS ---
    address = ", ".join(
        filter(None, [
            getattr(doctor.barangay, "name", None) if hasattr(doctor, "barangay") else None,
            getattr(doctor.city, "name", None) if hasattr(doctor, "city") else None,
            getattr(doctor.province, "name", None) if hasattr(doctor, "province") else None,
        ])
    )

    # --- FIX AVAILABILITIES ---
    availabilities = [
        {
            "id": a.id,
            "date": a.date,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "is_available": a.is_available,
        }
        for a in doctor.availabilities if a.is_available
    ]

    return {
        "doctor_id": doctor.doctor_id,
        "user_id": doctor.user_id,
        "name": full_name,
        "email": user.email,
        "specialization": specialization,
        "license_number": doctor.license_number,
        "years_of_experience": doctor.years_of_experience,
        "address": address,
        "is_verified": getattr(user, "is_verified", False),
        "is_doctor_approved": getattr(user, "is_doctor_approved", False),
        "created_at": doctor.created_at,
        "updated_at": doctor.updated_at,
        "availabilities": availabilities,
    }
