from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.users import User

router = APIRouter()

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.user_id,
        "email": user.email,
        "fname": user.fname,
        "lname": user.lname,
        "mname": user.mname,
        "sex": user.sex,
        "dob": user.dob.isoformat() if user.dob else None,
        "contact_number": user.contact_number,
        "picture": user.picture,
        "role": user.role.value,
        "address": user.address.street if user.address else None
    }
