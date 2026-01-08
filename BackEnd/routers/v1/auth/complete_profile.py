from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool # 👈 Added for speed
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json 
import asyncio # 👈 Added for speed

from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor, Specialization
from models.location import Province, City, Barangay
from core.security import create_access_token, create_refresh_token, get_password_hash
from core.services.cloudinary_config import cloudinary
import cloudinary.uploader

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
    """

    # 🔹 Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔹 Convert IDs to integers (PSGC codes)
    province_code = int(province_id)
    city_code = int(city_id)
    barangay_code = int(barangay_id)

    # 🔹 Province - Create if doesn't exist
    province_obj = db.query(Province).filter(Province.id == province_code).first()
    if not province_obj:
        province_obj = Province(id=province_code, name=province_name.strip())
        db.add(province_obj)
        db.commit()

    # 🔹 City - Create if doesn't exist
    city_obj = db.query(City).filter(City.id == city_code).first()
    if not city_obj:
        city_obj = City(id=city_code, name=city_name.strip(), province_id=province_code)
        db.add(city_obj)
        db.commit()

    # 🔹 Barangay - Create if doesn't exist
    barangay_obj = db.query(Barangay).filter(Barangay.id == barangay_code).first()
    if not barangay_obj:
        barangay_obj = Barangay(id=barangay_code, name=barangay_name.strip(), city_id=city_code)
        db.add(barangay_obj)
        db.commit()

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
        # 🛡️ CHECK IF DOCTOR EXISTS TO PREVENT CRASH
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()

        if not doctor:
            # Create new if doesn't exist
            doctor = Doctor(
                user_id=user.id,
                license_number=license_number,
                years_of_experience=int(years_of_experience) if years_of_experience else None
            )
            db.add(doctor)
        else:
            # Update existing
            if license_number: doctor.license_number = license_number
            if years_of_experience: doctor.years_of_experience = int(years_of_experience)

        # 🚀 OPTIMIZED: Upload all 3 images in parallel (Much Faster!)
        async def upload_async(file_obj, folder_path):
            if not file_obj: return None
            try:
                # run_in_threadpool prevents blocking the server
                result = await run_in_threadpool(
                    cloudinary.uploader.upload, 
                    file_obj.file, 
                    folder=folder_path
                )
                return result.get("secure_url")
            except Exception as e:
                print(f"Upload failed: {e}")
                return None

        # Prepare tasks
        upload_tasks = [
            upload_async(prc_license_front, f"licenses/{user.id}"),
            upload_async(prc_license_back, f"licenses/{user.id}"),
            upload_async(prc_license_selfie, f"licenses/{user.id}")
        ]

        # Run them all at once
        results = await asyncio.gather(*upload_tasks)

        # Assign results
        if results[0]: doctor.prc_license_front = results[0]
        if results[1]: doctor.prc_license_back = results[1]
        if results[2]: doctor.prc_license_selfie = results[2]

        
        # 🛡️ ROBUST SPECIALIZATION HANDLING
        if specializations:
            try:
                specs = json.loads(specializations)
            except Exception:
                specs = [specializations]

            doctor.specializations = [] 
            found_names = []  # To store names for the JSON column

            for spec_name_or_id in specs:
                # Find or Create Specialization
                spec = None
                if isinstance(spec_name_or_id, int) or (isinstance(spec_name_or_id, str) and spec_name_or_id.isdigit()):
                    spec = db.query(Specialization).filter(Specialization.specialization_id == int(spec_name_or_id)).first()
                else:
                    spec = db.query(Specialization).filter(Specialization.name == str(spec_name_or_id).strip()).first()

                if not spec:
                    # 🛑 SAFETY GUARD: If frontend sent "6" and we didn't find it,
                    # DO NOT create a specialization named "6". Skip it!
                    if str(spec_name_or_id).isdigit():
                        print(f"⚠️ Warning: Specialization ID {spec_name_or_id} not found in DB. Skipping creation.")
                        continue 

                    # Only create if it's a real name (e.g., "Neuro-Surgery")
                    spec = Specialization(name=str(spec_name_or_id).strip())
                    db.add(spec)
                    db.commit()
                    db.refresh(spec)

                doctor.specializations.append(spec)
                found_names.append(spec.name)

            # SAVE TO JSON COLUMN (Fixes the empty column issue)
            doctor.specializations_json = json.dumps(found_names)

    # 🔹 Final commit for all data
    db.commit()
    db.refresh(user)

    # 🔹 Create tokens
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "email": user.email}
    )

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
            "address": f"{barangay_obj.name}, {city_obj.name}, {province_obj.name}",
        },
    }