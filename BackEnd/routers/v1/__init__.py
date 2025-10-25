# routers/v1/__init__.py
from fastapi import APIRouter
from .auth import router as auth_router
from .doctors import router as doctors_router
from .appointments import router as appointments_router
from .notifications import router as notifications_router
from .schedules import router as schedules_router
from .patient.patient import router as patient_router
from .admin.admin import router as admin_router

router = APIRouter()

# ✅ Include routers
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(doctors_router, prefix="/doctors", tags=["Doctors"])
router.include_router(appointments_router, prefix="/appointments", tags=["Appointments"])
router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
router.include_router(schedules_router, prefix="/schedules", tags=["Schedules"])
router.include_router(patient_router, prefix="/patient", tags=["Patient"])
router.include_router(admin_router, prefix="/admin", tags=["Admin"])
