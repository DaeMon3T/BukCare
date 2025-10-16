# routers/v1/auth/complete_profile.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from core.database import get_db
from models.users import User
from core.security import (
    create_access_token, 
    create_refresh_token,
    get_password_hash  # ✅ Import the hash function
)

router = APIRouter()


class CompleteProfileRequest(BaseModel):
    user_id: int
    sex: bool
    dob: str
    contact_number: str
    address_id: int | None = None
    password: str


@router.post("/complete-profile")
def complete_profile(request: CompleteProfileRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user profile
    user.sex = request.sex
    user.dob = datetime.strptime(request.dob, "%Y-%m-%d")
    user.contact_number = request.contact_number
    user.password = get_password_hash(request.password)  # ✅ Hash the password!
    user.is_profile_complete = True
    
    db.commit()
    db.refresh(user)

    # Re-issue tokens
    access_token = create_access_token({
        "user_id": user.user_id, 
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.user_id, 
        "email": user.email
    })
    
    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()  # Update last login
    db.commit()

    return {
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        },
        "user": {
            "user_id": user.user_id,
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