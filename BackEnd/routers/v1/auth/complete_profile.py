from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor
from models.location import Province, City, Barangay
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
    province: str = Form(...),
    city: str = Form(...),
    barangay: str = Form(...),
    password: str = Form(...),
    license_number: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    specializations: Optional[str] = Form(None),
    prc_license_front: Optional[UploadFile] = File(None),
    prc_license_back: Optional[UploadFile] = File(None),
    prc_license_selfie: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Province: check if exists, if not create
    province_obj = db.query(Province).filter(
        Province.name.ilike(province.strip())
    ).first()

    if not province_obj:
        province_obj = Province(name=province.strip())
        db.add(province_obj)
        db.flush()  # Flush to get the ID without committing

    # ✅ City: check if exists (by name AND province), if not create
    city_obj = db.query(City).filter(
        City.name.ilike(city.strip()),
        City.province_id == province_obj.id
    ).first()

    if not city_obj:
        city_obj = City(name=city.strip(), province_id=province_obj.id)
        db.add(city_obj)
        db.flush()  # Flush to get the ID without committing

    # ✅ Barangay: check if exists (by name AND city), if not create
    barangay_obj = db.query(Barangay).filter(
        Barangay.name.ilike(barangay.strip()),
        Barangay.city_id == city_obj.id
    ).first()

    if not barangay_obj:
        barangay_obj = Barangay(name=barangay.strip(), city_id=city_obj.id)
        db.add(barangay_obj)
        db.flush()  # Flush to get the ID without committing

    # ✅ Update user profile
    user.sex = sex == "1"
    user.dob = datetime.strptime(dob, "%Y-%m-%d").date()
    user.contact_number = contact_number
    user.password = get_password_hash(password)
    user.is_profile_complete = True
    user.province_id = province_obj.id
    user.city_id = city_obj.id
    user.barangay_id = barangay_obj.id

    # ✅ FIX: Update user role properly
    if role.lower() == "doctor":
        user.role = UserRole.DOCTOR
    elif role.lower() == "patient":
        user.role = UserRole.PATIENT
    else:
        user.role = UserRole.PENDING

    # ✅ Doctor-specific handling
    if role.lower() == "doctor":
        doctor = Doctor(
            user_id=user.id,
            license_number=license_number,
            years_of_experience=int(years_of_experience) if years_of_experience else None,
            province_id=province_obj.id,
            city_id=city_obj.id,
            barangay_id=barangay_obj.id,
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
            except Exception:
                doctor.specializations_json = specializations

        db.add(doctor)

    # ✅ Commit all changes at once
    db.commit()
    db.refresh(user)

    # ✅ Generate tokens
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

    # ✅ Return success response
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
            "address": f"{barangay_obj.name}, {city_obj.name}, {province_obj.name}"
        }
    }
