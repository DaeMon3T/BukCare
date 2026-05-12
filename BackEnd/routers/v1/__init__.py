"""
v1 API router.

Single source of truth for every v1 endpoint. `main.py` mounts this whole
package at `/v1`, so every route below resolves to `/v1/<prefix>/<path>`.

Conventions:
- Routers in sub-packages (auth/, admin/, patient/) export `router` from
  their __init__.py and are mounted with an explicit prefix here.
- Flat-file routers either declare their own `prefix=` internally
  (in which case we mount them with no extra prefix) or are mounted with
  an explicit prefix here. Both patterns coexist; the comment beside each
  entry shows the resulting URL.
"""

from fastapi import APIRouter

# Sub-packages
from .auth import router as auth_router
from .admin import router as admin_router
from .patient.patient import router as patient_router

# Flat routers (no internal prefix)
from .appointments import router as appointments_router
from .notifications import router as notifications_router
from .schedules import router as schedules_router
from .messages import router as messages_router
from .vitals import router as vitals_router
from .reviews import router as reviews_router
from .walk_ins import router as walk_ins_router
from .staff_access import router as staff_access_router

# Flat routers that declare their own prefix internally
from .doctors import router as doctors_router            # prefix=/doctors
from .medical_profile import router as medical_profile_router  # prefix=/medical-profile
from .tips import router as tips_router                  # prefix=/tips
from .hospitals import router as hospitals_router        # prefix=/hospitals

router = APIRouter()

# ---- Auth & accounts ----
router.include_router(auth_router,        prefix="/auth",          tags=["Authentication"])

# ---- Roles ----
router.include_router(admin_router,       prefix="/admin",         tags=["Admin"])
router.include_router(patient_router,     prefix="/patient",       tags=["Patient"])
router.include_router(doctors_router,                              tags=["Doctors"])           # /v1/doctors/...

# ---- Booking domain ----
router.include_router(appointments_router, prefix="/appointments", tags=["Appointments"])
router.include_router(schedules_router,    prefix="/schedules",    tags=["Schedules"])
router.include_router(walk_ins_router,     prefix="/walk-ins",     tags=["Walk-Ins"])
router.include_router(staff_access_router, prefix="/staff-access", tags=["Staff Access"])

# ---- Patient clinical data ----
router.include_router(medical_profile_router,                      tags=["Medical Profile"])   # /v1/medical-profile/...
router.include_router(vitals_router,       prefix="/vitals",       tags=["Patient Vitals"])

# ---- Communication ----
router.include_router(messages_router,                             tags=["Messages"])          # /v1/messages/...
router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

# ---- Discovery / extras ----
router.include_router(reviews_router,      prefix="/reviews",      tags=["Reviews"])
router.include_router(hospitals_router,                            tags=["Hospitals"])         # /v1/hospitals/...
router.include_router(tips_router,                                 tags=["Health Tips"])       # /v1/tips/...
