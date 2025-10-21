# routers/v1/auth/signin.py

import urllib.parse
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from core.config import settings
from core.database import get_db
from core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    ACCESS_TOKEN_EXPIRE_SECONDS,
)
from models.users import User, UserRole
from schemas.auth import LoginRequest

router = APIRouter()


# -----------------------------------------
# Helper - Standard Response
# -----------------------------------------
def build_response(user: User, access_token: str, refresh_token: str, action: str):
    return {
        "action": action,  # either "signin" or "signup"
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
            "picture": user.picture,
            "role": user.role.value if user.role else None,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
            "is_active": user.is_active,
        },
    }


# -----------------------------------------
# Unified Google Auth Logic
# -----------------------------------------
def handle_google_auth(idinfo: dict, db: Session, redirect_flow: bool = False):
    """
    Handles both Google Sign In and Sign Up.
    - If the email doesn't exist → create user (no role yet)
    - If it exists → sign them in and update info
    """

    google_data = {
        "google_id": idinfo.get("sub"),
        "email": idinfo.get("email"),
        "email_verified": idinfo.get("email_verified"),
        "fname": idinfo.get("given_name", ""),
        "lname": idinfo.get("family_name", ""),
        "picture": idinfo.get("picture", ""),
    }

    if not google_data["email"]:
        raise HTTPException(status_code=400, detail="No email returned by Google")

    user = db.query(User).filter(User.email == google_data["email"]).first()
    action = "signin"

    if not user:
        # 🆕 New Google user — must complete profile before accessing app
        user = User.from_oauth({
            **google_data,
            "role": None,  # frontend assigns during complete-profile
            "is_profile_complete": False,
        })
        db.add(user)
        db.commit()
        db.refresh(user)
        action = "signup"
    else:
        # Existing user — update info and login
        user.update_from_oauth(google_data)
        user.last_login = datetime.utcnow()

        if user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        db.commit()
        db.refresh(user)

    # 🔐 Generate tokens
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if user.role else None,
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email,
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # 🌐 Redirect-based Google login flow
    if redirect_flow:
        if not user.is_profile_complete:
            # New or incomplete user → redirect to complete-profile
            redirect_url = (
                f"{settings.FRONTEND_URL}/complete-profile?"
                f"user_id={user.id}"
                f"&email={urllib.parse.quote(user.email)}"
                f"&fname={urllib.parse.quote(user.fname or '')}"
                f"&lname={urllib.parse.quote(user.lname or '')}"
                f"&picture={urllib.parse.quote(user.picture or '')}"
                f"&token={access_token}&refresh={refresh_token}"
            )
        elif user.role == UserRole.ADMIN:
            redirect_url = f"{settings.FRONTEND_URL}/admin/dashboard?token={access_token}&refresh={refresh_token}"
        elif user.role == UserRole.DOCTOR:
            redirect_url = f"{settings.FRONTEND_URL}/doctor/dashboard?token={access_token}&refresh={refresh_token}"
        elif user.role == UserRole.PATIENT:
            redirect_url = f"{settings.FRONTEND_URL}/patient/dashboard?token={access_token}&refresh={refresh_token}"
        else:
            redirect_url = f"{settings.FRONTEND_URL}/auth/success?token={access_token}&refresh={refresh_token}"

        return RedirectResponse(url=redirect_url)

    # 🧾 API-based Google login (One Tap / popup)
    return build_response(user, access_token, refresh_token, action)


# -----------------------------------------
# Email/Password Signin
# -----------------------------------------
@router.post("/signin", summary="Email/Password Signin")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not user.password or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if user.role else None,
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email,
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()

    if user.role == UserRole.ADMIN:
        user.is_profile_complete = True

    db.commit()
    db.refresh(user)

    return build_response(user, access_token, refresh_token, "signin")


# -----------------------------------------
# Google OAuth Routes
# -----------------------------------------
@router.get("/google/login", summary="Redirect user to Google OAuth")
def google_login():
    google_auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return RedirectResponse(f"{google_auth_endpoint}?{urllib.parse.urlencode(params)}")


@router.get("/google/callback", summary="Handle Google OAuth callback", response_class=RedirectResponse)
def google_callback(code: str = Query(None), error: str = Query(None), db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"Google error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    response = requests.post(token_url, data=data)
    if not response.ok:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    tokens = response.json()
    idinfo = id_token.verify_oauth2_token(
        tokens["id_token"],
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
        clock_skew_in_seconds=10
    )

    return handle_google_auth(idinfo, db, redirect_flow=True)


@router.post("/google/signin", summary="Google Sign-In / Sign-Up via ID Token")
def google_signin(payload: dict, db: Session = Depends(get_db)):
    id_token_str = payload.get("id_token")
    if not id_token_str:
        raise HTTPException(status_code=400, detail="Missing Google ID token")

    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {e}")

    return handle_google_auth(idinfo, db, redirect_flow=False)
