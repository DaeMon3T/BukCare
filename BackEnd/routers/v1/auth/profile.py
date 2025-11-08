from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from routers.v1.dependencies import get_current_user, get_db
from models.users import User
from schemas.users import UserProfile, UserUpdate
from core.cloudinary_config import cloudinary
import cloudinary.uploader

router = APIRouter()

# -------------------------------
# GET /profile - View Profile
# -------------------------------
@router.get("/profile", response_model=UserProfile, tags=["Profile"])
def read_profile(current_user: User = Depends(get_current_user)):
    """
    Get the profile of the currently logged-in user.
    Works for all roles.
    """
    return current_user


# -------------------------------
# PUT /profile - Update Profile
# -------------------------------
@router.put("/profile", response_model=UserProfile, tags=["Profile"])
async def update_profile(
    user_update: UserUpdate = Depends(),
    profile_picture: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the profile of the currently logged-in user.
    Only updates fields provided in the request.
    Supports uploading a new profile picture to Cloudinary.
    """

    # Update fields from user_update dynamically
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    # Handle profile picture upload
    if profile_picture:
        try:
            upload_result = cloudinary.uploader.upload(
                profile_picture.file,
                folder=f"profile_pictures/{current_user.id}",
                public_id=f"profile_{current_user.id}",
                overwrite=True,
                resource_type="image"
            )
            current_user.picture = upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

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
