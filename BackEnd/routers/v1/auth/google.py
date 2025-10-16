# routers/v1/auth/google.py

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
from models.users import User

from fastapi import APIRouter, Response
from urllib.parse import urlencode

router = APIRouter(prefix="/google")

# -----------------------------------------------------------------------------
# Step 1: Redirect user to Google's OAuth consent screen
# -----------------------------------------------------------------------------
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


# -----------------------------------------------------------------------------
# Step 2: Handle Google's OAuth redirect callback
# -----------------------------------------------------------------------------
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

    # Exchange authorization code for tokens
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

    # Verify and extract ID token info
    idinfo = id_token.verify_oauth2_token(
        tokens["id_token"],
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )

    # Extract user info
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

    # -------------------------------------------------------------------------
    # Step 3: Check if user exists (Sign up or Sign in)
    # -------------------------------------------------------------------------
    user = db.query(User).filter(User.email == google_data["email"]).first()

    if not user:
        # Create new Google user (role, contact, etc. to be completed later)
        user = User.from_oauth(google_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        action = "signup"
    else:
        # Update existing user data if necessary
        if user.update_from_oauth(google_data):
            db.commit()
            db.refresh(user)
        action = "signin"

    # -------------------------------------------------------------------------
    # Step 4: Generate JWT tokens
    # -------------------------------------------------------------------------
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
    db.commit()

    # -------------------------------------------------------------------------
    # Step 5: Redirect based on new or existing user
    # -------------------------------------------------------------------------
    if not user.is_profile_complete:
        # New Google user → redirect to frontend "CompleteProfile" page
        redirect_url = (
            f"{settings.FRONTEND_URL}/complete-profile?"
            f"user_id={user.id}"
            f"&email={urllib.parse.quote(user.email)}"
            f"&fname={urllib.parse.quote(user.fname or '')}"
            f"&lname={urllib.parse.quote(user.lname or '')}"
            f"&picture={urllib.parse.quote(user.picture or '')}"
        )
    else:
        # Existing user → redirect to home or dashboard
        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/success?"
            f"action=signin"
            f"&token={access_token}"
            f"&refresh={refresh_token}"
        )

    return RedirectResponse(url=redirect_url)
