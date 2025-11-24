from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from core.database import get_db
from models.doctor import Doctor, DoctorAvailability
from models.users import User
from schemas.doctor import Doctor as DoctorSchema, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


# ============================================
# GET ALL DOCTORS - FIXED
# ============================================
@router.get("/", response_model=List[DoctorSchema])
def get_doctors(
    approved: Optional[bool] = Query(None, description="Filter by doctor approval status"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.province),  # ✅ Load via User
            joinedload(Doctor.user).joinedload(User.city),      # ✅ Load via User
            joinedload(Doctor.user).joinedload(User.barangay),  # ✅ Load via User
            joinedload(Doctor.specializations),
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
        # ✅ Access location data from user, not doctor
        address = ", ".join(
            filter(
                None,
                [
                    getattr(doc.user.barangay, "name", None) if doc.user.barangay else None,
                    getattr(doc.user.city, "name", None) if doc.user.city else None,
                    getattr(doc.user.province, "name", None) if doc.user.province else None,
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
                avatar=doc.user.picture,
                is_verified=doc.user.is_verified,
                is_doctor_approved=doc.user.is_doctor_approved,
            )
        )

    return results


# ============================================
# GET SINGLE DOCTOR BY ID - FIXED
# ============================================
@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.province),  # ✅ Load via User
            joinedload(Doctor.user).joinedload(User.city),      # ✅ Load via User
            joinedload(Doctor.user).joinedload(User.barangay),  # ✅ Load via User
            joinedload(Doctor.specializations),
            joinedload(Doctor.availabilities),
        )
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user = doctor.user

    # ✅ Build safe address from user's location data
    address = ", ".join(
        filter(
            None,
            [
                getattr(user.barangay, "name", None) if user.barangay else None,
                getattr(user.city, "name", None) if user.city else None,
                getattr(user.province, "name", None) if user.province else None,
            ],
        )
    )

    # Format availabilities
    availabilities = [
        {
            "id": a.id,
            "date": a.date.isoformat() if a.date else None,
            "start_time": a.start_time,
            "end_time": a.end_time,
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
        avatar=user.picture or "/default-avatar.png",
        availabilities=availabilities,
    )