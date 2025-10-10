import getpass
from core.database import SessionLocal
from models.users import User
from passlib.context import CryptContext

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_admin():
    db = SessionLocal()

    # Collect details
    email = input("Enter admin email: ").strip()
    fname = input("Enter first name: ").strip()
    lname = input("Enter last name: ").strip()

    while True:
        password = getpass.getpass("Enter password: ")
        confirm_password = getpass.getpass("Confirm password: ")

        if password != confirm_password:
            print("❌ Passwords do not match. Try again.")
        elif len(password) < 8:
            print("❌ Password must be at least 8 characters long.")
        else:
            break

    # Hash the password
    hashed_pw = hash_password(password)

    # Generate user_id manually using your model method
    user_id = User.generate_id(db)

    # Create admin user with profile complete and verified
    admin_user = User(
        user_id=user_id,  # <-- assign generated ID
        email=email,
        password=hashed_pw,
        role="admin",
        fname=fname,
        lname=lname,
        is_profile_complete=True,
        is_verified=True
    )

    # Save to DB
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print(f"✅ Admin account created successfully: {admin_user.email} (ID: {admin_user.user_id})")

if __name__ == "__main__":
    create_admin()
