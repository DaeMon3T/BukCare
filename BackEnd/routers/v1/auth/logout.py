from fastapi import APIRouter, Depends, Header
from typing import Optional
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.users import User

router = APIRouter(prefix="/logout", tags=["Authentication"])

@router.post("")
def logout(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Logout user by clearing refresh token"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("id")  # ✅ match this with how you encode JWT
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()  # ✅ fixed field name
                if user:
                    user.refresh_token = None
                    db.commit()
        except JWTError:
            pass
    return {"message": "Successfully logged out"}
