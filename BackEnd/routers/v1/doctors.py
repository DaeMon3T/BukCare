from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from core.database import get_db
from models.doctor import Doctor, DoctorAvailability
from models.users import User
from schemas.doctor import Doctor as DoctorSchema, DoctorResponse, DoctorUpdate
from datetime import date
from routers.v1.dependencies import get_current_user
from schemas.appointment import Appointment, AppointmentCreate, AppointmentSchema
from models.appointment import Appointment
from models.medical_profile import MedicalProfile


router = APIRouter(prefix="/doctors", tags=["Doctors"])

# ============================================
# NEW: GET MY DOCTOR PROFILE (For Profile Page)
# ============================================
@router.get("/profile/me", response_model=DoctorResponse)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the doctor profile linked to the currently logged-in user.
    Used for the Doctor Profile page to show License #, Experience, etc.
    """
    # 1. Find the Doctor record linked to this User ID
    doctor = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.province),
            joinedload(Doctor.user).joinedload(User.city),
            joinedload(Doctor.user).joinedload(User.barangay),
            joinedload(Doctor.specializations),
            joinedload(Doctor.availabilities),
        )
        .filter(Doctor.user_id == current_user.id)
        .first()
    )

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found for this user")

    user = doctor.user

    # 2. Build Address String
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

    # 3. Format Availabilities
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

    # 4. Return Combined Data (User + Doctor)
    return DoctorResponse(
        doctor_id=doctor.doctor_id,
        user_id=doctor.user_id,
        name=f"{user.fname} {user.lname}",
        email=user.email,
        specialization=doctor.specializations[0].name if doctor.specializations else "General Practice",
        address=address,
        license_number=doctor.license_number,     
        years_of_experience=doctor.years_of_experience, 
        bio=doctor.bio,
        consultation_fee=doctor.consultation_fee,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved, 
        avatar=user.picture or "/default-avatar.png",
        availabilities=availabilities,
    )


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
            joinedload(Doctor.user).joinedload(User.province),
            joinedload(Doctor.user).joinedload(User.city),
            joinedload(Doctor.user).joinedload(User.barangay),
            joinedload(Doctor.specializations),
        )
    )

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
# GET SINGLE DOCTOR BY ID
# ============================================
@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.province),
            joinedload(Doctor.user).joinedload(User.city),
            joinedload(Doctor.user).joinedload(User.barangay),
            joinedload(Doctor.specializations),
            joinedload(Doctor.availabilities),
        )
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user = doctor.user

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
        consultation_fee=doctor.consultation_fee,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved,
        avatar=user.picture or "/default-avatar.png",
        availabilities=availabilities,
    )

@router.delete("/availabilities/{availability_id}")
def delete_availability(
    availability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slot = db.query(DoctorAvailability).filter(
        DoctorAvailability.id == availability_id,
        DoctorAvailability.doctor_id == current_user.id
    ).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted"}


@router.delete("/availabilities/date/{target_date}")
def delete_day_availability(
    target_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted_count = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == current_user.id,
        DoctorAvailability.date == target_date
    ).delete()

    db.commit()
    
    if deleted_count == 0:
        return {"message": "No slots found for this date"}
        
    return {"message": f"Deleted {deleted_count} slots"}


@router.get("/patients/{patient_id}/history")
def get_patient_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Get the Patient User Info
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Get Medical Profile
    profile = db.query(MedicalProfile).filter(MedicalProfile.user_id == patient_id).first()

    # 3. Get Past Appointments (History)
    history = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status.in_(["completed", "confirmed"])
    ).order_by(Appointment.appointment_date.desc()).all()

    return {
        "patient": {
            "id": patient.id,
            "name": f"{patient.fname} {patient.lname}",
            "email": patient.email,
            "avatar": patient.picture or "/default-avatar.png"
        },
        "profile": profile,
        "appointments": history
    }


@router.post("/patients/{patient_id}/consultation", response_model=AppointmentSchema)
def create_consultation_record(
    patient_id: int,
    consultation_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates an instant 'Completed' appointment record (Walk-in Consultation).
    """
    new_record = Appointment(
        doctor_id=current_user.id,
        patient_id=patient_id,
        appointment_date=consultation_data.appointment_date,
        reason=consultation_data.reason or "Walk-in Consultation",
        notes=consultation_data.notes,
        status="completed"
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.put("/profile/me", response_model=DoctorResponse)
def update_my_doctor_profile(
    update_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the logged-in doctor's professional details (Bio, Fee).
    """
    # 1. Fetch Doctor
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # 2. Update Fields if provided
    if update_data.bio is not None:
        doctor.bio = update_data.bio
    
    if update_data.consultation_fee is not None:
        doctor.consultation_fee = update_data.consultation_fee

    # 3. Save
    db.commit()
    db.refresh(doctor)

    # 4. Return updated profile (Re-use the logic from GET or construct response)
    # For simplicity, we construct it here, but ideally you extract this to a helper function
    user = doctor.user
    
    # Re-construct address
    address = ", ".join(filter(None, [
        getattr(user.barangay, "name", None) if user.barangay else None,
        getattr(user.city, "name", None) if user.city else None,
        getattr(user.province, "name", None) if user.province else None,
    ]))

    # Re-construct availabilities
    availabilities = [
        {"id": a.id, "date": a.date.isoformat() if a.date else None, "start_time": a.start_time, "end_time": a.end_time, "is_available": a.is_available}
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
        bio=doctor.bio,                       # <--- Return new Bio
        consultation_fee=doctor.consultation_fee, # <--- Return new Fee
        availabilities=availabilities
    )