from fastapi import APIRouter
from .admin import router as admin_router
from .health import router as health_router

router = APIRouter()

# Include the main admin router (e.g., dashboard, stats, etc.)
router.include_router(admin_router, prefix="", tags=["Admin"])

# Include health endpoints under admin
router.include_router(health_router, tags=["System Health"])
