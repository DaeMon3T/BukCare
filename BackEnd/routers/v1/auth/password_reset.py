from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import requests as http_requests
from core.config import settings
from core.database import get_db
from models.users import User
from core.services.email import send_email
from passlib.context import CryptContext

router = APIRouter(prefix="/password-reset", tags=["Password Reset"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -----------------------------
# Turnstile Helper
# -----------------------------
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


# -----------------------------
# Schemas
# -----------------------------
class PasswordResetRequest(BaseModel):
    email: EmailStr
    cf_turnstile_response: str          # required on Step 1


class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    new_password: str


# -----------------------------
# Step 1: Request OTP
# -----------------------------
@router.post("/request", summary="Request a password reset OTP")
def request_password_reset(
    data: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Turnstile check first
    if not verify_turnstile(data.cf_turnstile_response):
        raise HTTPException(status_code=400, detail="Verification failed. Please try again.")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(secrets.randbelow(900000) + 100000)
    expiry = datetime.utcnow() + timedelta(minutes=10)

    user.reset_token = otp
    user.reset_token_expires = expiry
    db.commit()

    background_tasks.add_task(
        send_email,
        to=user.email,
        subject="BukCare Password Reset OTP",
        body=f"Your OTP for password reset is {otp}. It expires in 10 minutes."
    )

    return {"message": "OTP sent to your email."}


# -----------------------------
# Step 2: Verify OTP
# -----------------------------
@router.post("/verify", summary="Verify the OTP sent to your email")
def verify_otp(data: PasswordResetVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.reset_token or user.reset_token != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified successfully."}


# -----------------------------
# Step 3: Confirm New Password
# -----------------------------
@router.post("/confirm", summary="Confirm new password after OTP verification")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = pwd_context.hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password successfully reset."}