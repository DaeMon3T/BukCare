from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from core.database import get_db
from models.doctor import Doctor
from schemas.doctor import Doctor as DoctorSchema

router = APIRouter()

@router.get("/", response_model=List[DoctorSchema])
def get_doctors(db: Session = Depends(get_db)):
    """
    Get all doctors with their linked user info, specialization, and location
    """
    doctors = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.specializations),
            joinedload(Doctor.province),
            joinedload(Doctor.city),
            joinedload(Doctor.barangay),
        )
        .all()
    )

    if not doctors:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No doctors found")

    return [
        DoctorSchema(
            doctor_id=doc.doctor_id,
            name=f"{doc.user.fname} {doc.user.lname}",
            email=doc.user.email,
            specialization=doc.specializations,
            license_number=doc.license_number,
            years_of_experience=doc.years_of_experience,
            address=f"{doc.barangay.name if doc.barangay else ''}, "
                    f"{doc.city.name if doc.city else ''}, "
                    f"{doc.province.name if doc.province else ''}"
        )
        for doc in doctors
    ]
