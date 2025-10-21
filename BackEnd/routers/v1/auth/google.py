# routers/v1/auth/google_signin.py

import urllib.parse
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from core.config import settings
from core.database import get_db
from core.security import create_access_token, create_refresh_token
from models.users import User, UserRole  # Ensure your User model has .from_oauth() and .update_from_oauth()

router = APIRouter(prefix="/google", tags=["Authentication"])


# -----------------------------------------
# 1️⃣ Redirect-based OAuth login
# -----------------------------------------
@router.get("/login", summary="Redirect user to Google OAuth consent screen")
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


# -----------------------------------------
# 2️⃣ OAuth callback handler
# -----------------------------------------
@router.get("/callback", summary="Handle Google OAuth callback")
def google_callback(
    code: str = Query(None),
    error: str = Query(None),
    db: Session = Depends(get_db),
):
    if error:
        raise HTTPException(status_code=400, detail=f"Google error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # Exchange code for tokens
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

    # Verify ID token
    idinfo = id_token.verify_oauth2_token(
        tokens["id_token"],
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
        clock_skew_in_seconds=10
    )

    return _process_google_user(idinfo, db, redirect_flow=True)


# -----------------------------------------
# 3️⃣ Direct ID Token Sign-in (used by `googleSignIn()` frontend)
# -----------------------------------------
@router.post("/signin", summary="Sign in using Google ID token (One Tap or popup)")
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


# -----------------------------------------
# 🧩 Shared logic for OAuth and direct sign-in
# -----------------------------------------
def _process_google_user(idinfo, db: Session, redirect_flow: bool = False):
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
        # New user (no default role)
        user = User.from_oauth({
            **google_data,
            "role": None,
            "is_profile_complete": False
        })
        db.add(user)
        db.commit()
        db.refresh(user)
        action = "signup"
    else:
        # Existing user
        updated = user.update_from_oauth(google_data)
        user.last_login = datetime.utcnow()

        if user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        if updated:
            db.commit()
            db.refresh(user)

    # Tokens
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if user.role else None,
    })
    refresh_token = create_refresh_token({
        "user_id": user.id,
        "email": user.email,
    })

    # Save refresh token
    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # 🔁 If redirect flow → redirect user
    if redirect_flow:
        if user.role == UserRole.ADMIN:
            redirect_url = f"{settings.FRONTEND_URL}/admin/dashboard?token={access_token}&refresh={refresh_token}"
        elif user.role == UserRole.PENDING:
            redirect_url = (
                f"{settings.FRONTEND_URL}/pending-approval?"
                f"user_id={user.id}&email={urllib.parse.quote(user.email)}"
                f"&token={access_token}&refresh={refresh_token}"
            )
        elif not user.is_profile_complete:
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
            redirect_url = (
                f"{settings.FRONTEND_URL}/auth/success?"
                f"action={action}"
                f"&token={access_token}&refresh={refresh_token}"
            )
        return RedirectResponse(url=redirect_url)

    # 🔐 Otherwise return JSON
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
            "picture": user.picture,
            "role": user.role.value if user.role else None,
            "is_profile_complete": user.is_profile_complete,
        },
        "action": action
    }
