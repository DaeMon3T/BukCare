# routers/v1/profile.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from routers.v1.dependencies import get_current_user, get_db
from models.users import User
from schemas.users import UserProfile, UserUpdate
from core.services.cloudinary_config import cloudinary
import cloudinary.uploader

router = APIRouter(tags=["Profile"])

# -------------------------------
# GET /profile - View Profile
# -------------------------------
@router.get("/profile", response_model=UserProfile)
def read_profile(current_user: User = Depends(get_current_user)):
    """
    Get the profile of the currently logged-in user.
    """
    return current_user


# -------------------------------
# PUT /profile - Update Profile Fields
# -------------------------------
@router.put("/profile", response_model=UserProfile)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the profile fields of the logged-in user.
    Does NOT handle profile picture.
    """
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    # Auto-mark profile as complete if all key fields exist
    required_fields = [
        current_user.fname,
        current_user.lname,
        current_user.sex,
        current_user.dob,
        current_user.contact_number,
    ]
    current_user.is_profile_complete = all(required_fields)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


# -------------------------------
# PUT /profile/picture - Update Profile Picture
# -------------------------------
@router.put("/profile/picture", response_model=UserProfile, tags=["Profile"])
async def update_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a new profile picture to Cloudinary and save the URL to the database.
    """

    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder=f"profile_pictures/{current_user.id}",
            public_id=f"profile_{current_user.id}",
            overwrite=True,
            resource_type="image"
        )
        # Re-fetch user in the current session
        db_user = db.query(User).filter(User.id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        db_user.picture = upload_result["secure_url"]

        db.commit()
        db.refresh(db_user)

        return db_user

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")