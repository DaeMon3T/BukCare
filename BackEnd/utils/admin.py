from core.database import SessionLocal
from models.users import User, UserRole
from passlib.context import CryptContext
from core.config import settings

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_admin_if_not_exists():
    """
    Ensure the default admin exists in the database.
    Reads credentials from environment variables (settings).
    """
    db = SessionLocal()
    try:
        admin_email = settings.ADMIN_EMAIL
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            return  # Admin already exists

        # Create the admin user
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            fname=settings.ADMIN_FIRST_NAME or "Admin",  # Changed from ADMIN_FNAME
            lname=settings.ADMIN_LAST_NAME or "User",    # Changed from ADMIN_LNAME
            is_active=True,
            is_verified=True,
            is_profile_complete=True,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Default admin created: {admin_user.email} (ID: {admin_user.id})")

    except Exception as e:
        print(f"Failed to create admin: {e}")
        db.rollback()
    finally:
        db.close()