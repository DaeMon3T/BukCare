from core.database import Base

# Import modules so SQLAlchemy registers the models
from models import location
from models import users
from models import doctor
from models import appointment
from models import notification
from models import staff
from models import audit_log
from models import doctor_staff_access

# Explicitly expose all model classes so models.X works
from models.location import Province, City, Barangay
from models.users import User
from models.doctor import Doctor, DoctorAvailability, Specialization
from models.appointment import Appointment
from models.notification import Notification
from models.staff import Staff
from models.audit_log import AuditLog
from models.doctor_staff_access import DoctorStaffAccess

__all__ = [
    "Base",
    "Province",
    "City",
    "Barangay",
    "User",
    "Doctor",
    "DoctorAvailability",
    "Specialization",
    "Appointment",
    "Notification",
    "Staff",
    "AuditLog",
    "DoctorStaffAccess",
]
