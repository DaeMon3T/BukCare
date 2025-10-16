# routers/v1/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.users import User
from routers.v1.dependencies import get_current_admin
from core.database import get_db

router = APIRouter(tags=["Admin"])

# ========================
# Admin dashboard stats
# ========================
@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    Returns basic counts of users for the admin dashboard.
    """
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(User).filter(User.role == "doctor").count()
    total_staff = db.query(User).filter(User.role == "staff").count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "pending_approvals": 0,   # placeholder for future features
        "active_sessions": 0,     # placeholder for future features
        "pending_invites": 0      # now always 0 since invite feature is removed
    }
