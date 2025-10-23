# routers/v1/__init__.py
from fastapi import APIRouter
from .auth import router as auth_router
from .doctors import router as doctors_router  # ✅ import your doctors router

router = APIRouter()

# ✅ Include routers
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(doctors_router, prefix="/doctors", tags=["Doctors"])
