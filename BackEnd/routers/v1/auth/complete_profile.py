from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json
import asyncio
import requests as http_requests

from core.config import settings
from core.database import get_db
from models.users import User, UserRole
from models.doctor import Doctor, Specialization
from models.staff import Staff
from models.location import Province, City, Barangay
from core.security import create_access_token, create_refresh_token, get_password_hash
from core.services.cloudinary_config import cloudinary
import cloudinary.uploader

router = APIRouter(tags=["Authentication"])


# -----------------------------------------
# Helper - Verify Cloudflare Turnstile Token
# -----------------------------------------
def verify_turnstile(token: str) -> bool:
    try:
        response = http_requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
            },
            timeout=5,
        )
        return response.json().get("success", False)
    except Exception:
        return False


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
    cf_turnstile_response: str = Form(...),        # Turnstile token
    license_number: Optional[str] = Form(None),
    years_of_experience: Optional[str] = Form(None),
    specializations: Optional[str] = Form(None),
    prc_license_front: Optional[UploadFile] = File(None),
    prc_license_back: Optional[UploadFile] = File(None),
    prc_license_selfie: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # ------------------------------------------------------------------
    # TURNSTILE VERIFICATION
    # ------------------------------------------------------------------
    if not cf_turnstile_response:
        raise HTTPException(status_code=400, detail="Missing verification token. Please complete the CAPTCHA.")

    if not verify_turnstile(cf_turnstile_response):
        raise HTTPException(status_code=400, detail="Verification failed. Please try again.")

    # ------------------------------------------------------------------
    # USER
    # ------------------------------------------------------------------
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    province_code = int(province_id)
    city_code = int(city_id)
    barangay_code = int(barangay_id)

    # ------------------------------------------------------------------
    # LOCATION UPSERT (NO COMMITS)
    # ------------------------------------------------------------------
    province = db.get(Province, province_code)
    if not province:
        province = Province(
            id=province_code,
            name=province_name.strip(),
        )
        db.add(province)

    city = db.get(City, city_code)
    if not city:
        city = City(
            id=city_code,
            name=city_name.strip(),
            province_id=province_code,
        )
        db.add(city)

    barangay = db.get(Barangay, barangay_code)
    if not barangay:
        barangay = Barangay(
            id=barangay_code,
            name=barangay_name.strip(),
            city_id=city_code,
        )
        db.add(barangay)

    # ------------------------------------------------------------------
    # USER UPDATE
    # ------------------------------------------------------------------
    user.sex = sex.lower() == "true"
    user.dob = datetime.strptime(dob, "%Y-%m-%d").date()
    user.contact_number = contact_number
    user.password = get_password_hash(password)
    user.is_profile_complete = True
    user.province_id = province_code
    user.city_id = city_code
    user.barangay_id = barangay_code

    requested_role = (
        UserRole.DOCTOR if role.lower() == "doctor"
        else UserRole.STAFF if role.lower() == "staff"
        else UserRole.PATIENT if role.lower() == "patient"
        else UserRole.PENDING
    )

    # Doctors and Staff require admin approval — keep as PENDING
    if requested_role in (UserRole.DOCTOR, UserRole.STAFF):
        user.role = UserRole.PENDING
    else:
        user.role = requested_role

    # ------------------------------------------------------------------
    # DOCTOR LOGIC
    # ------------------------------------------------------------------
    if requested_role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter_by(user_id=user.id).first()
        if not doctor:
            doctor = Doctor(user_id=user.id)
            db.add(doctor)

        doctor.license_number = license_number
        doctor.years_of_experience = int(years_of_experience) if years_of_experience else None

        async def upload(file):
            if not file:
                return None
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                file.file,
                folder=f"licenses/{user.id}",
            )
            return result.get("secure_url")

        front_url, back_url, selfie_url = await asyncio.gather(
            upload(prc_license_front),
            upload(prc_license_back),
            upload(prc_license_selfie),
        )

        if front_url:
            doctor.prc_license_front = front_url
        if back_url:
            doctor.prc_license_back = back_url
        if selfie_url:
            doctor.prc_license_selfie = selfie_url

        # --------------------------------------------------------------
        # SPECIALIZATIONS
        # --------------------------------------------------------------
        if specializations:
            try:
                specs = json.loads(specializations)
            except Exception:
                specs = [specializations]

            doctor.specializations.clear()
            found_names = []

            for item in specs:
                spec = None

                if str(item).isdigit():
                    spec = db.query(Specialization).filter(
                        Specialization.specialization_id == int(item)
                    ).first()
                else:
                    spec = db.query(Specialization).filter(
                        Specialization.name == str(item).strip()
                    ).first()

                if not spec and not str(item).isdigit():
                    spec = Specialization(name=str(item).strip())
                    db.add(spec)

                if spec:
                    doctor.specializations.append(spec)
                    found_names.append(spec.name)

            doctor.specializations_json = json.dumps(found_names)

    # ------------------------------------------------------------------
    # STAFF LOGIC
    # ------------------------------------------------------------------
    elif requested_role == UserRole.STAFF:
        staff = db.query(Staff).filter_by(user_id=user.id).first()
        if not staff:
            staff = Staff(user_id=user.id)
            db.add(staff)

        async def upload(file):
            if not file:
                return None
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                file.file,
                folder=f"staffs/{user.id}",
            )
            return result.get("secure_url")

        front_url, back_url, selfie_url = await asyncio.gather(
            upload(prc_license_front),
            upload(prc_license_back),
            upload(prc_license_selfie),
        )

        if front_url:
            staff.proof_front = front_url
        if back_url:
            staff.proof_back = back_url
        if selfie_url:
            staff.proof_selfie = selfie_url

    # ------------------------------------------------------------------
    # TOKENS & FINAL USER UPDATE
    # ------------------------------------------------------------------
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "email": user.email}
    )

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()

    # ------------------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------------------
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
            "address": f"{barangay.name}, {city.name}, {province.name}",
        },
    }
