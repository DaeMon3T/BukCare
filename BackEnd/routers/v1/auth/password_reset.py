# routers/v1/auth/password_reset.py

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from core.database import get_db
from models.users import User
from core.email import send_email  # we'll define this below

router = APIRouter()

# ----- Schemas -----
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# ----- Routes -----

@router.post("/password-reset/request")
def request_password_reset(data: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Step 1: User submits their email → system generates OTP and sends via email
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate 6-digit OTP
    otp = str(secrets.randbelow(900000) + 100000)
    expiry = datetime.utcnow() + timedelta(minutes=10)

    user.reset_token = otp
    user.reset_token_expires = expiry
    db.commit()

    # Send email asynchronously
    background_tasks.add_task(
        send_email,
        to=user.email,
        subject="BukCare Password Reset OTP",
        body=f"Your OTP for password reset is {otp}. It expires in 10 minutes."
    )

    return {"message": "OTP sent to your email."}


@router.post("/password-reset/verify")
def verify_otp_and_reset_password(data: PasswordResetVerify, db: Session = Depends(get_db)):
    """
    Step 2: User submits email + OTP + new password → verify & update password
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.reset_token or user.reset_token != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    # Hash the new password (for security)
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_pw = pwd_context.hash(data.new_password)

    # Update user record
    user.password = hashed_pw
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password successfully reset."}
