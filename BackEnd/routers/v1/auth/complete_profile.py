# routers/v1/auth/complete_profile.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from core.database import get_db
from models.users import User
from models.doctor import Doctor
from models.patient import Patient
from models.address import Address
from core.security import create_access_token, create_refresh_token, get_password_hash
from core.config import settings
import cloudinary.uploader
from core.cloudinary_config import cloudinary
import json

router = APIRouter()


@router.post("/complete-profile")
async def complete_profile(
    user_id: int = Form(...),
    role: str = Form(...),
    sex: str = Form(...),
    dob: str = Form(...),
    contact_number: str = Form(...),
    province_id: str = Form(...),
    city_id: str = Form(...),
    barangay: str = Form(...),
    password: str = Form(...),
    confirmPassword: str = Form(...),
    license_number: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    specializations: Optional[str] = Form(None),
    prc_license_front: Optional[UploadFile] = File(None),
    prc_license_back: Optional[UploadFile] = File(None),
    prc_license_selfie: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # Validate passwords
    if password != confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create address
    address = Address(
        barangay=barangay,
        city_id=int(city_id)
    )
    db.add(address)
    db.flush()  # get address_id

    # Update user profile
    user.sex = sex == "1"
    user.dob = datetime.strptime(dob, "%Y-%m-%d").date()
    user.contact_number = contact_number
    user.password = get_password_hash(password)
    user.address_id = address.address_id
    user.is_profile_complete = True

    # Doctor-specific handling
    if role.lower() == "doctor":
        doctor = Doctor(
            user_id=user.id,
            license_number=license_number,
            years_of_experience=int(years_of_experience) if years_of_experience else None,
            address_id=address.address_id,
            is_verified=False
        )

        # Upload files to Cloudinary
        if prc_license_front:
            result = cloudinary.uploader.upload(prc_license_front.file, folder=f"licenses/{user.id}")
            doctor.prc_license_front = result["secure_url"]

        if prc_license_back:
            result = cloudinary.uploader.upload(prc_license_back.file, folder=f"licenses/{user.id}")
            doctor.prc_license_back = result["secure_url"]

        if prc_license_selfie:
            result = cloudinary.uploader.upload(prc_license_selfie.file, folder=f"licenses/{user.id}")
            doctor.prc_license_selfie = result["secure_url"]

        # Parse specializations JSON string
        if specializations:
            try:
                specs = json.loads(specializations)
                doctor.specializations_json = json.dumps(specs)
            except:
                doctor.specializations_json = specializations

        db.add(doctor)

    elif role.lower() == "patient":
        patient = Patient(
            user_id=user.id,
            address_id=address.address_id
        )
        db.add(patient)

    # Commit all changes
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        },
        "user": {
            "user_id": user.id,
            "email": user.email,
            "fname": user.fname,
            "lname": user.lname,
            "name": f"{user.fname} {user.lname}",
            "picture": user.picture,
            "role": user.role.value,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
        }
    }
