from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from models.users import User
from models.doctor import Doctor
from models.location import City, Province
from routers.v1.dependencies import get_current_user

router = APIRouter()

@router.get("/doctors", response_model=List[dict])
def get_available_doctors(
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of available doctors with optional filtering"""
    query = db.query(Doctor).join(User).filter(
        User.is_active == True,
        User.role == "doctor",
        Doctor.is_verified == True
    )
    
    if specialization:
        query = query.filter(Doctor.specializations_json.contains(specialization))
    
    if city:
        query = query.join(User).filter(User.city_id == city)
    
    doctors = query.all()
    
    return [
        {
            "doctor_id": doctor.doctor_id,
            "user_id": doctor.user_id,
            "name": f"{doctor.user.fname} {doctor.user.lname}",
            "email": doctor.user.email,
            "specializations": doctor.specializations_json,
            "years_of_experience": doctor.years_of_experience,
            "is_verified": doctor.is_verified,
            "city": doctor.city.name if doctor.city else None,
            "province": doctor.province.name if doctor.province else None
        }
        for doctor in doctors
    ]

@router.get("/doctors/{doctor_id}", response_model=dict)
def get_doctor_details(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific doctor"""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    return {
        "doctor_id": doctor.doctor_id,
        "user_id": doctor.user_id,
        "name": f"{doctor.user.fname} {doctor.user.lname}",
        "email": doctor.user.email,
        "specializations": doctor.specializations_json,
        "years_of_experience": doctor.years_of_experience,
        "is_verified": doctor.is_verified,
        "license_number": doctor.license_number,
        "city": doctor.city.name if doctor.city else None,
        "province": doctor.province.name if doctor.province else None,
        "barangay": doctor.barangay.name if doctor.barangay else None
    }

@router.get("/profile", response_model=dict)
def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current patient's profile"""
    if current_user.role.value != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "fname": current_user.fname,
        "mname": current_user.mname,
        "lname": current_user.lname,
        "name": f"{current_user.fname} {current_user.lname}",
        "sex": current_user.sex,
        "dob": current_user.dob,
        "contact_number": current_user.contact_number,
        "picture": current_user.picture,
        "is_verified": current_user.is_verified,
        "is_profile_complete": current_user.is_profile_complete,
        "province": current_user.province.name if current_user.province else None,
        "city": current_user.city.name if current_user.city else None,
        "barangay": current_user.barangay.name if current_user.barangay else None,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.put("/profile", response_model=dict)
def update_patient_profile(
    fname: Optional[str] = None,
    mname: Optional[str] = None,
    lname: Optional[str] = None,
    sex: Optional[bool] = None,
    dob: Optional[str] = None,
    contact_number: Optional[str] = None,
    province_id: Optional[int] = None,
    city_id: Optional[int] = None,
    barangay_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update patient profile"""
    if current_user.role.value != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update their profile"
        )
    
    # Update fields if provided
    if fname is not None:
        current_user.fname = fname
    if mname is not None:
        current_user.mname = mname
    if lname is not None:
        current_user.lname = lname
    if sex is not None:
        current_user.sex = sex
    if dob is not None:
        current_user.dob = dob
    if contact_number is not None:
        current_user.contact_number = contact_number
    if province_id is not None:
        current_user.province_id = province_id
    if city_id is not None:
        current_user.city_id = city_id
    if barangay_id is not None:
        current_user.barangay_id = barangay_id
    
    # Check if profile is complete
    required_fields = [current_user.fname, current_user.lname, current_user.sex, 
                      current_user.dob, current_user.contact_number]
    current_user.is_profile_complete = all(field is not None for field in required_fields)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "is_profile_complete": current_user.is_profile_complete
    }

