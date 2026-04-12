import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from core.database import get_db
from models.doctor import Doctor, DoctorAvailability, Specialization
from models.users import User
from models.review import Review
from schemas.doctor import Doctor as DoctorSchema, DoctorResponse, DoctorUpdate
from datetime import date
from routers.v1.dependencies import get_current_user
from schemas.appointment import Appointment, AppointmentCreate, AppointmentSchema
from models.appointment import Appointment
from models.medical_profile import MedicalProfile
from models.doctor import SpecializationRequest
from schemas.doctor import OCRResponse, SpecializationRequestCreate, SpecializationRequestResponse
from utils.ocr import extract_license_info
from fastapi import UploadFile, File


router = APIRouter(prefix="/doctors", tags=["Doctors"])

# ============================================
# GET MY DOCTOR PROFILE (For Profile Page)
# ============================================
@router.get("/profile/me", response_model=DoctorResponse)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    # Send FULL list as JSON string
    specs_list = [s.name for s in doctor.specializations]
    spec_str = json.dumps(specs_list) if specs_list else "General Practice"

    return DoctorResponse(
        doctor_id=doctor.doctor_id,
        user_id=doctor.user_id,
        name=f"{user.fname} {user.lname}",
        email=user.email,
        specialization=spec_str,
        address=address,
        license_number=doctor.license_number,     
        years_of_experience=doctor.years_of_experience, 
        bio=doctor.bio,
        consultation_fee=doctor.consultation_fee,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved, 
        status=doctor.status,
        avatar=user.picture or "/default-avatar.png",
        availabilities=availabilities,
        average_rating=db.query(func.avg(Review.rating)).filter(Review.doctor_id == user.id).scalar() or 0.0,
        total_reviews=db.query(func.count(Review.id)).filter(Review.doctor_id == user.id).scalar() or 0,
    )


# ============================================
# GET ALL DOCTORS
# ============================================
@router.get("/", response_model=List[DoctorSchema])
def get_doctors(
    approved: Optional[bool] = Query(None, description="Filter by doctor approval status"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max items to return"),
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

    # Apply Pagination (Slice the query)
    # This prevents fetching 10,000 doctors at once
    doctors = query.offset(skip).limit(limit).all()

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

        # Send FULL list as JSON string here too
        specs_list = [s.name for s in doc.specializations]
        spec_str = json.dumps(specs_list) if specs_list else "General Practice"

        # Calculate Ratings
        review_stats = db.query(
            func.avg(Review.rating), 
            func.count(Review.id)
        ).filter(Review.doctor_id == doc.user_id).first()
        
        avg_rating = float(review_stats[0]) if review_stats[0] else 0.0
        total_revs = int(review_stats[1]) if review_stats[1] else 0

        results.append(
            DoctorSchema(
                doctor_id=doc.doctor_id,
                user_id=doc.user_id,
                name=f"{doc.user.fname} {doc.user.lname}",
                email=doc.user.email,
                specialization=spec_str,
                address=address,
                avatar=doc.user.picture,
                is_verified=doc.user.is_verified,
                is_doctor_approved=doc.user.is_doctor_approved,
                status=doc.status,
                average_rating=avg_rating,
                total_reviews=total_revs
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



    # Send FULL list
    specs_list = [s.name for s in doctor.specializations]
    spec_str = json.dumps(specs_list) if specs_list else "General Practice"

    return DoctorResponse(
        doctor_id=doctor.doctor_id,
        user_id=doctor.user_id,
        name=f"{user.fname} {user.lname}",
        email=user.email,
        specialization=spec_str,
        address=address,
        license_number=doctor.license_number,
        years_of_experience=doctor.years_of_experience,
        consultation_fee=doctor.consultation_fee,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved,
        status=doctor.status,
        avatar=user.picture or "/default-avatar.png",
        availabilities=availabilities,
        average_rating=db.query(func.avg(Review.rating)).filter(Review.doctor_id == user.id).scalar() or 0.0,
        total_reviews=db.query(func.count(Review.id)).filter(Review.doctor_id == user.id).scalar() or 0,
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
    # Get the Patient User Info
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get Medical Profile
    profile = db.query(MedicalProfile).filter(MedicalProfile.user_id == patient_id).first()

    # Get Past Appointments (History)
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
    # Fetch Doctor
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # Update Fields if provided
    if update_data.bio is not None:
        doctor.bio = update_data.bio
    
    if update_data.consultation_fee is not None:
        doctor.consultation_fee = update_data.consultation_fee

    if update_data.status is not None:
        doctor.status = update_data.status

    # Save
    db.commit()
    db.refresh(doctor)

    user = doctor.user
    
    address = ", ".join(filter(None, [
        getattr(user.barangay, "name", None) if user.barangay else None,
        getattr(user.city, "name", None) if user.city else None,
        getattr(user.province, "name", None) if user.province else None,
    ]))

    availabilities = [
        {"id": a.id, "date": a.date.isoformat() if a.date else None, "start_time": a.start_time, "end_time": a.end_time, "is_available": a.is_available}
        for a in doctor.availabilities if a.is_available
    ]



    # Send FULL list here too
    specs_list = [s.name for s in doctor.specializations]
    spec_str = json.dumps(specs_list) if specs_list else "General Practice"

    return DoctorResponse(
        doctor_id=doctor.doctor_id,
        user_id=doctor.user_id,
        name=f"{user.fname} {user.lname}",
        email=user.email,
        specialization=spec_str,
        address=address,
        license_number=doctor.license_number,
        years_of_experience=doctor.years_of_experience,
        is_verified=user.is_verified,
        is_doctor_approved=user.is_doctor_approved,
        status=doctor.status,
        avatar=user.picture or "/default-avatar.png",
        bio=doctor.bio,
        consultation_fee=doctor.consultation_fee,
        availabilities=availabilities,
        average_rating=db.query(func.avg(Review.rating)).filter(Review.doctor_id == user.id).scalar() or 0.0,
        total_reviews=db.query(func.count(Review.id)).filter(Review.doctor_id == user.id).scalar() or 0,
    )


# ============================================
# PRC LICENSE OCR (Groq)
# ============================================
@router.post("/license-ocr", response_model=OCRResponse)
async def perform_license_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Extracts license number and expiry from a PRC photo using Groq Vision.
    """
    contents = await file.read()
    result = await extract_license_info(contents)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return OCRResponse(**result)


# ============================================
# SPECIALIZATION MANAGEMENT
# ============================================
@router.post("/specializations/request", response_model=SpecializationRequestResponse)
def request_new_specialization(
    request_data: SpecializationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Doctors can request a new specialization by providing proof.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # Check if already has it
    existing = db.query(SpecializationRequest).filter(
        SpecializationRequest.doctor_id == doctor.doctor_id,
        SpecializationRequest.specialization_id == request_data.specialization_id,
        SpecializationRequest.status == "pending"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A request for this specialization is already pending")

    new_request = SpecializationRequest(
        doctor_id=doctor.doctor_id,
        specialization_id=request_data.specialization_id,
        document_url=request_data.document_url,
        status="pending"
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    # Enrich with spec name
    spec = db.query(Specialization).filter(Specialization.specialization_id == new_request.specialization_id).first()
    
    return SpecializationRequestResponse(
        id=new_request.id,
        doctor_id=new_request.doctor_id,
        specialization_id=new_request.specialization_id,
        specialization_name=spec.name if spec else "Unknown",
        document_url=new_request.document_url,
        status=new_request.status,
        created_at=new_request.created_at
    )


@router.get("/specializations/requests/me", response_model=List[SpecializationRequestResponse])
def get_my_specialization_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all specialization requests for the current doctor.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        return []
        
    requests = db.query(SpecializationRequest).filter(
        SpecializationRequest.doctor_id == doctor.doctor_id
    ).all()
    
    results = []
    for r in requests:
        spec = db.query(Specialization).filter(Specialization.specialization_id == r.specialization_id).first()
        results.append(SpecializationRequestResponse(
            id=r.id,
            doctor_id=r.doctor_id,
            specialization_id=r.specialization_id,
            specialization_name=spec.name if spec else "Unknown",
            document_url=r.document_url,
            status=r.status,
            admin_notes=r.admin_notes,
            created_at=r.created_at
        ))
        
    return results