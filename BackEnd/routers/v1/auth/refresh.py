# routers/v1/auth/refresh.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import create_access_token, verify_refresh_token
from models.users import User
from schemas.auth import RefreshTokenRequest, TokenResponse

router = APIRouter()


@router.post("/refresh", response_model=TokenResponse, summary="Refresh Access Token", tags=["Authentication"])
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Use a valid refresh token to generate a new access token.
    """
    # Verify refresh token
    payload = verify_refresh_token(data.refresh_token)
    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Get user from DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Optional: check if refresh token matches stored token
    if user.refresh_token != data.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch")

    # Generate new access token
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })

    # Return new tokens
    return {
        "access_token": access_token,
        "refresh_token": data.refresh_token,  # same refresh token
        "token_type": "bearer",
        "expires_in": 60 * 60,  # example 1h
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
