import getpass
from core.database import SessionLocal
from models.users import User, UserRole
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

    # Create admin user (SQLAlchemy will auto-generate 'id')
    admin_user = User(
        email=email,
        password=hashed_pw,
        role=UserRole.ADMIN,
        fname=fname,
        lname=lname
    )

    # Save to DB
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print(f"✅ Admin account created successfully: {admin_user.email} (ID: {admin_user.id})")

if __name__ == "__main__":
    create_admin()
