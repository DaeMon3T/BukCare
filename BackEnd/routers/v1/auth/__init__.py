from fastapi import APIRouter

# Import routers
from .signin import router as signin_router
from .logout import router as logout_router
from .password_reset import router as password_reset_router
from .complete_profile import router as complete_profile_router
from .google import router as google_router
from .refresh import router as refresh_router

# Create main auth router
router = APIRouter()

# ------------------------------
# Email/Password Authentication
# ------------------------------
router.include_router(signin_router)
router.include_router(logout_router)
router.include_router(password_reset_router)
router.include_router(complete_profile_router)
router.include_router(refresh_router)

# ------------------------------
# Google OAuth Authentication
# ------------------------------
router.include_router(google_router)
