# routers/v1/auth/signin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from core.database import get_db
from core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    ACCESS_TOKEN_EXPIRE_SECONDS,
)
from models.users import User
from schemas.auth import LoginRequest

router = APIRouter()


def build_response(user: User, access_token: str, refresh_token: str):
    """
    Build the response object for a successful login.
    """
    return {
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
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
        },
    }


@router.post(
    "/signin",
    summary="User Signin",
    description="Authenticate user via email/password and return access + refresh tokens",
    response_description="Login response containing user info and tokens",
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Traditional email/password login endpoint.
    """
    # Fetch user by email
    user = db.query(User).filter(User.email == data.email).first()

    # Verify user exists and password is correct
    if not user or not user.password or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create access and refresh tokens
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email
    })

    # Update user refresh token and last login
    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()

    # Return structured response
    return build_response(user, access_token, refresh_token)
