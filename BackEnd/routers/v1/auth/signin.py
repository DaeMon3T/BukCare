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
# Helper - Verify Cloudflare Turnstile Token
# -----------------------------------------
def verify_turnstile(token: str) -> bool:
    """
    Verifies the Cloudflare Turnstile token against Cloudflare's siteverify API.
    Returns True if valid, False otherwise.
    """
    try:
        response = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
            },
            timeout=5,
        )
        result = response.json()
        return result.get("success", False)
    except Exception:
        return False


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
    google_data = {
        "google_id": idinfo.get("sub"),
        "email": idinfo.get("email"),
        "email_verified": idinfo.get("email_verified"),
        "fname": idinfo.get("given_name", ""),
        "lname": idinfo.get("family_name", ""),
        "picture": idinfo.get("picture", ""),
    }

    if not google_data["email"]:
        raise HTTPException(status_code=400, detail="Google did not return an email.")

    user = db.query(User).filter(User.email == google_data["email"]).first()
    action = "signin"

    if not user:
        # New Google user
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
        # Existing user update
        user.update_from_oauth(google_data)
        user.last_login = datetime.utcnow()
        if not user.role:
            user.is_profile_complete = False
        elif user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        db.commit()
        db.refresh(user)

    # -----------------------------
    # UNIVERSAL LOGIN PROTECTION
    # -----------------------------

    # Block inactive accounts
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support.")

    # Block doctors who are not approved yet
    if user.role == UserRole.DOCTOR and not user.is_doctor_approved:
        raise HTTPException(status_code=403, detail="Your doctor account is pending approval.")

    # Block staff who are not approved yet
    if user.role == UserRole.STAFF and not user.is_staff_approved:
        raise HTTPException(status_code=403, detail="Your staff account is pending approval.")

    # -----------------------------
    # Token generation
    # -----------------------------
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

    # Redirect-based Google OAuth
    if redirect_flow:
        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/callback?"
            f"token={access_token}"
            f"&refresh={refresh_token}"
            f"&user_id={user.id}"
            f"&email={user.email}"
            f"&fname={user.fname or ''}"
            f"&lname={user.lname or ''}"
            f"&picture={user.picture or ''}"
            f"&role={(user.role.value if user.role else '')}"
            f"&is_profile_complete={'true' if user.is_profile_complete else 'false'}"
            f"&is_verified={'true' if user.is_verified else 'false'}"
            f"&is_active={'true' if user.is_active else 'false'}"
        )
        return RedirectResponse(url=redirect_url)

    # API JSON Response (One-Tap)
    return build_response(user, access_token, refresh_token, action)


# -----------------------------------------
# Email/Password Signin
# -----------------------------------------
@router.post("/signin", summary="Email/Password Signin")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    # -----------------------------
    # Turnstile Verification
    # -----------------------------
    if not data.cf_turnstile_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing verification token. Please complete the CAPTCHA."
        )

    if not verify_turnstile(data.cf_turnstile_response):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification failed. Please try again."
        )

    # -----------------------------
    # Credential Check
    # -----------------------------
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not user.password or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Block ALL inactive accounts
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support.")

    # Block unapproved doctors
    if user.role == UserRole.DOCTOR and not user.is_doctor_approved:
        raise HTTPException(status_code=403, detail="Your doctor account is pending approval.")

    # Block unapproved staff
    if user.role == UserRole.STAFF and not user.is_staff_approved:
        raise HTTPException(status_code=403, detail="Your staff account is pending approval.")

    # Ensure role exists
    if not user.role:
        raise HTTPException(status_code=400, detail="User role not assigned. Contact support.")

    # Tokens
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email
    })

    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()

    # Admin = auto complete
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
        error_url = f"{settings.FRONTEND_URL}/auth/callback?error={urllib.parse.quote(error)}"
        return RedirectResponse(url=error_url)

    if not code:
        error_url = f"{settings.FRONTEND_URL}/auth/callback?error={urllib.parse.quote('Missing authorization code')}"
        return RedirectResponse(url=error_url)

    try:
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
            error_url = f"{settings.FRONTEND_URL}/auth/callback?error={urllib.parse.quote('Failed to exchange code for token')}"
            return RedirectResponse(url=error_url)

        tokens = response.json()
        idinfo = id_token.verify_oauth2_token(
            tokens["id_token"],
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        return handle_google_auth(idinfo, db, redirect_flow=True)

    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/auth/callback?error={urllib.parse.quote(str(e))}"
        return RedirectResponse(url=error_url)


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