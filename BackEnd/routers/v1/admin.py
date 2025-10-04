from routers.v1.dependencies import get_current_admin
from schemas.invitation import InviteUserRequest
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.users import User
from models.invitation import Invitation

from core.database import get_db
from datetime import datetime, timedelta
import uuid
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from decouple import config  # for loading from .env

# No /admin prefix here, main.py already applies /api/v1/admin
router = APIRouter(tags=["Admin"])

# Load email config from .env
conf = ConnectionConfig(
    MAIL_USERNAME=config("EMAIL_HOST_USER"),
    MAIL_PASSWORD=config("EMAIL_HOST_PASSWORD"),
    MAIL_FROM=config("DEFAULT_FROM_EMAIL"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

@router.post("/invite")
async def invite_user(
    request: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    email = request.email
    role = request.role

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    # Check for pending invitation
    pending_invite = db.query(Invitation).filter(
        Invitation.email == email,
        Invitation.status == "pending",
        Invitation.expires_at > datetime.utcnow()
    ).first()
    if pending_invite:
        raise HTTPException(status_code=400, detail="A pending invitation already exists for this email")

    token = str(uuid.uuid4())
    invite = Invitation(
        email=email,
        role=role,
        invited_by=current_user.user_id,  # <-- make sure to use correct PK field
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=1)
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send email with link
    # ✅ Different signup links based on role
    if role == "doctor":
        signup_link = f"http://localhost:5173/doctor/signup?invite_token={token}"
    else:
        # For staff or other roles
        signup_link = f"http://localhost:5173/auth/signup?invite_token={token}"
    message = MessageSchema(
        subject="You are invited to BukCare",
        recipients=[email],
        body=f"Click here to complete your signup: {signup_link}",
        subtype="html"
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        return {
            "warning": "Invitation created but email failed to send",
            "details": str(e)
        }

    return {"message": "Invitation sent successfully", "token": token}


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(User).filter(User.role == "doctor").count()
    total_staff = db.query(User).filter(User.role == "staff").count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "pending_approvals": 0,
        "active_sessions": 0,
        "pending_invites": 0
    }
