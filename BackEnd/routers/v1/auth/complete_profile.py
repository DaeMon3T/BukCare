from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from models.location import Province, City, Barangay
from core.security import create_access_token, create_refresh_token, get_password_hash
from core.services.cloudinary_config import cloudinary
import cloudinary.uploader
import json

router = APIRouter(tags=["Authentication"])


@router.post("/complete-profile")
async def complete_profile(
    user_id: int = Form(...),
    role: str = Form(...),
    sex: str = Form(...),
    dob: str = Form(...),
    contact_number: str = Form(...),
    province_id: str = Form(...), 
    city_id: str = Form(...),
    barangay_id: str = Form(...),
    province_name: str = Form(...),
    city_name: str = Form(...),  
    barangay_name: str = Form(...),
    password: str = Form(...),
    license_number: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    specializations: Optional[str] = Form(None),
    prc_license_front: Optional[UploadFile] = File(None),
    prc_license_back: Optional[UploadFile] = File(None),
    prc_license_selfie: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Completes a user's profile with address, personal info, and role.
    Now uses PSGC codes for location data.
    """

    # 🔹 Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔹 Convert IDs to integers (PSGC codes)
    province_code = int(province_id)
    city_code = int(city_id)
    barangay_code = int(barangay_id)

    # 🔹 Province - Create if doesn't exist with PSGC code
    province_obj = db.query(Province).filter(Province.id == province_code).first()
    if not province_obj:
        province_obj = Province(
            id=province_code,
            name=province_name.strip()
        )
        db.add(province_obj)
        db.commit()
        db.refresh(province_obj)

    # 🔹 City - Create if doesn't exist with PSGC code
    city_obj = db.query(City).filter(City.id == city_code).first()
    if not city_obj:
        city_obj = City(
            id=city_code,
            name=city_name.strip(),
            province_id=province_code
        )
        db.add(city_obj)
        db.commit()
        db.refresh(city_obj)

    # 🔹 Barangay - Create if doesn't exist with PSGC code
    barangay_obj = db.query(Barangay).filter(Barangay.id == barangay_code).first()
    if not barangay_obj:
        barangay_obj = Barangay(
            id=barangay_code,
            name=barangay_name.strip(),
            city_id=city_code
        )
        db.add(barangay_obj)
        db.commit()
        db.refresh(barangay_obj)

    # 🔹 Update user info
    user.sex = sex == "1"
    user.dob = datetime.strptime(dob, "%Y-%m-%d").date()
    user.contact_number = contact_number
    user.password = get_password_hash(password)
    user.is_profile_complete = True
    user.province_id = province_code
    user.city_id = city_code
    user.barangay_id = barangay_code

    # 🔹 Assign user role
    if role.lower() == "doctor":
        user.role = UserRole.DOCTOR
    elif role.lower() == "patient":
        user.role = UserRole.PATIENT
    else:
        user.role = UserRole.PENDING

    # 🔹 Handle doctor-specific fields
    if role.lower() == "doctor":
        doctor = Doctor(
            user_id=user.id,
            license_number=license_number,
            years_of_experience=int(years_of_experience)
            if years_of_experience
            else None
        )

        # Upload PRC files to Cloudinary
        if prc_license_front:
            result = cloudinary.uploader.upload(
                prc_license_front.file, folder=f"licenses/{user.id}"
            )
            doctor.prc_license_front = result["secure_url"]

        if prc_license_back:
            result = cloudinary.uploader.upload(
                prc_license_back.file, folder=f"licenses/{user.id}"
            )
            doctor.prc_license_back = result["secure_url"]

        if prc_license_selfie:
            result = cloudinary.uploader.upload(
                prc_license_selfie.file, folder=f"licenses/{user.id}"
            )
            doctor.prc_license_selfie = result["secure_url"]

        # Handle specializations (JSON)
        if specializations:
            try:
                specs = json.loads(specializations)
                doctor.specializations_json = json.dumps(specs)
            except Exception:
                doctor.specializations_json = specializations

        db.add(doctor)

    # 🔹 Final commit for all data
    db.commit()
    db.refresh(user)

    # 🔹 Create tokens
    access_token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
        }
    )
    refresh_token = create_refresh_token(
        {
            "user_id": user.id,
            "email": user.email,
        }
    )

    # 🔹 Save refresh token and last login
    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()

    # 🔹 Return final response
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
            "address": f"{barangay_obj.name}, {city_obj.name}, {province_obj.name}",
        },
    }