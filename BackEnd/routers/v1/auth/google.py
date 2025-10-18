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
from models.users import User, UserRole  # IMPORTANT: import UserRole

router = APIRouter(prefix="/google")


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
        clock_skew_in_seconds=10 
    )

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

    # Find or create user
    user = db.query(User).filter(User.email == google_data["email"]).first()

    if not user:
        # If you expect the frontend to pass a role during signup via query params,
        # you can read it from the callback query (e.g., ?role=doctor). If not provided,
        # default to PATIENT.
        # Example (optional): role_param = your logic to fetch role from state
        role_value = None  # default: no role provided from Google flow
        role_enum = UserRole(role_value) if (role_value and role_value in UserRole._value2member_map_) else None

        user = User.from_oauth({**google_data, "role": role_value})
        # If role is admin (rare via OAuth), ensure profile complete
        if user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        db.add(user)
        db.commit()
        db.refresh(user)
        action = "signup"
    else:
        # Update existing user if needed
        updated = user.update_from_oauth(google_data)
        # Ensure last_login is updated
        user.last_login = datetime.utcnow()

        # If role became ADMIN, mark profile complete
        if user.role == UserRole.ADMIN:
            user.is_profile_complete = True

        if updated:
            db.commit()
            db.refresh(user)
        action = "signin"

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

    # Save refresh token and update last_login
    user.refresh_token = refresh_token
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Role-based redirect logic (correct enum comparison)
    if user.role == UserRole.ADMIN:
        # Admins bypass complete-profile and go directly to admin dashboard
        redirect_url = (
            f"{settings.FRONTEND_URL}/admin/dashboard?"
            f"token={access_token}&refresh={refresh_token}"
        )
    elif not user.is_profile_complete:
        # New or incomplete user → redirect to complete-profile (frontend will handle token on submit)
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
        # Regular signed-in user with completed profile
        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/success?"
            f"action={action}"
            f"&token={access_token}&refresh={refresh_token}"
        )

    return RedirectResponse(url=redirect_url)
