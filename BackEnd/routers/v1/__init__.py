from fastapi import APIRouter
from .auth import router as auth_router

# from . import users, admin, doctors, appointments, notifications, schedules

router = APIRouter()

# Only include auth router
router.include_router(auth_router)
