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
# 🧩 Helper Functions
# -----------------------------------------
def build_response(user: User, access_token: str, refresh_token: str):
    """Standardized API response for login/signin."""
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
            "role": user.role.value if user.role else None,
            "is_verified": user.is_verified,
            "is_profile_complete": user.is_profile_complete,
            "is_active": user.is_active,
        },
    }


def _process_google_user(idinfo, db: Session, redirect_flow: bool = False):
    """Handles Google sign-in logic (both redirect and One Tap)."""
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
        # 🆕 New user — no role yet (will be assigned after complete-profile)
        user = User.from_oauth({
            **google_data,
            "role": None,
            "is_profile_complete": False,
        })
        db.add(user)
        db.commit()
        db.refresh(user)
        action = "signup"
    else:
        # Existing user — update info
        updated = user.update_from_oauth(google_data)
        user.last_login = datetime.utcnow()

        # Admins are always complete
        if user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        if updated:
            db.commit()
            db.refresh(user)

    # Generate tokens
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

    # If OAuth redirect flow
    if redirect_flow:
        role = user.role.value if user.role else None

        if user.role == UserRole.ADMIN:
            redirect_url = f"{settings.FRONTEND_URL}/admin/dashboard?token={access_token}&refresh={refresh_token}"
        elif user.role == UserRole.PENDING:
            redirect_url = (
                f"{settings.FRONTEND_URL}/pending-approval?"
                f"user_id={user.id}&email={urllib.parse.quote(user.email)}"
                f"&token={access_token}&refresh={refresh_token}"
            )
        elif not user.is_profile_complete:
            # No role yet, profile incomplete → go to complete-profile
            redirect_url = (
                f"{settings.FRONTEND_URL}/complete-profile?"
                f"user_id={user.id}"
                f"&email={urllib.parse.quote(user.email)}"
                f"&fname={urllib.parse.quote(user.fname or '')}"
                f"&lname={urllib.parse.quote(user.lname or '')}"
                f"&picture={urllib.parse.quote(user.picture or '')}"
                f"&token={access_token}&refresh={refresh_token}"
            )
        else:
            # Redirect based on existing role
            if role == UserRole.DOCTOR.value:
                redirect_url = f"{settings.FRONTEND_URL}/doctor/dashboard?token={access_token}&refresh={refresh_token}"
            elif role == UserRole.PATIENT.value:
                redirect_url = f"{settings.FRONTEND_URL}/patient/dashboard?token={access_token}&refresh={refresh_token}"
            else:
                redirect_url = (
                    f"{settings.FRONTEND_URL}/auth/success?"
                    f"action={action}"
                    f"&token={access_token}&refresh={refresh_token}"
                )

        return RedirectResponse(url=redirect_url)

    # Return JSON for One Tap or popup sign-in
    return build_response(user, access_token, refresh_token)


# -----------------------------------------
# ✉️ Email/Password Signin
# -----------------------------------------
@router.post("/signin", summary="User Signin")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not user.password or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Create tokens
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

    # Admin bypasses complete-profile
    if user.role == UserRole.ADMIN:
        user.is_profile_complete = True

    db.commit()
    db.refresh(user)

    return build_response(user, access_token, refresh_token)


# -----------------------------------------
# 🌐 Google OAuth Flow
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

    return _process_google_user(idinfo, db, redirect_flow=True)


@router.post("/google/signin", summary="Sign in using Google ID token")
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

    return _process_google_user(idinfo, db, redirect_flow=False)
