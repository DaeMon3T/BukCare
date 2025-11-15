from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from core.database import get_db
from models.doctor import Doctor, DoctorAvailability
from models.users import User
from schemas.doctor import Doctor as DoctorSchema, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


# ============================================
# GET ALL DOCTORS
# ============================================
@router.get("/", response_model=List[DoctorSchema])
def get_doctors(
    approved: Optional[bool] = Query(None, description="Filter by doctor approval status"),
    db: Session = Depends(get_db),
):
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

    # Filter by approval status
    if approved is not None:
        query = query.join(User).filter(User.is_doctor_approved == approved)

    doctors = query.all()

    if not doctors:
        return []

    results = []
    for doc in doctors:
        address = ", ".join(
            filter(
                None,
                [
                    getattr(doc.barangay, "name", None),
                    getattr(doc.city, "name", None),
                    getattr(doc.province, "name", None),
                ],
            )
        )

        results.append(
            DoctorSchema(
                doctor_id=doc.doctor_id,
                user_id=doc.user_id,
                name=f"{doc.user.fname} {doc.user.lname}",
                email=doc.user.email,
                specialization=(
                    doc.specializations[0].name if doc.specializations else "General Practice"
                ),
                address=address,
                is_verified=doc.user.is_verified,
                is_doctor_approved=doc.user.is_doctor_approved,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
        )

    return results


# ============================================
# GET SINGLE DOCTOR BY ID (FIXED)
# ============================================
@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.specializations),
            joinedload(Doctor.availabilities),
            joinedload(Doctor.province),
            joinedload(Doctor.city),
            joinedload(Doctor.barangay),
        )
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user = doctor.user

    # Build safe address
    address = ", ".join(
        filter(
            None,
            [
                getattr(doctor.barangay, "name", None),
                getattr(doctor.city, "name", None),
                getattr(doctor.province, "name", None),
            ],
        )
    )

    # Format availabilities - Pydantic will handle the conversion
    availabilities = [
        {
            "id": a.id,
            "date": a.date.isoformat() if a.date else None,
            "start_time": a.start_time,  # Pydantic will convert time object
            "end_time": a.end_time,      # Pydantic will convert time object
            "is_available": a.is_available,
        }
        for a in doctor.availabilities if a.is_available
    ]

    return DoctorResponse(
        doctor_id=doctor.doctor_id,
        user_id=doctor.user_id,
        name=f"{user.fname} {user.lname}",
        email=user.email,
        specialization=doctor.specializations[0].name if doctor.specializations else "General Practice",
        address=address,
        license_number=doctor.license_number,
        years_of_experience=doctor.years_of_experience,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved,
        created_at=doctor.created_at,
        updated_at=doctor.updated_at,
        availabilities=availabilities,
    )