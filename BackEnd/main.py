# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.database import engine, Base

# Import ALL models BEFORE creating tables
# Order matters: import models without foreign keys first
from models.address import Province, CityMunicipality, Address
#from models.specialization import Specialization
from models.users import User
#from models.doctor import Doctor
#from models.appointment import Appointment
#from models.notification import Notification

# Import routers
from routers.v1 import auth, users

# Create database tables AFTER all models are imported
Base.metadata.create_all(bind=engine)

# App instance
app = FastAPI(
    title="BukCare API",
    description="Online Appointment API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print("=" * 80)
    print("EXCEPTION:")
    print(traceback.format_exc())
    print("=" * 80)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# API Routes
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{api_v1_prefix}/users", tags=["Users"])


@app.get("/")
def read_root():
    return {
        "name": "BukCare API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/debug/routes")
def list_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods)
            })
    return {"total": len(routes), "routes": routes}