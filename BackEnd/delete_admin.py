from core.database import SessionLocal
from models.users import User

def delete_admin(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"❌ No user found with email {email}")
        return
    
    db.delete(user)
    db.commit()
    print(f"✅ User with email {email} has been deleted")

if __name__ == "__main__":
    email_to_delete = input("Enter the email of the admin to delete: ").strip()
    delete_admin(email_to_delete)
