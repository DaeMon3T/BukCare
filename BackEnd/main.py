from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from utils.admin import create_admin_if_not_exists
from core.config import settings
from core.database import Base, engine, SessionLocal 
from core.logging_config import setup_logging, get_logger
from middleware.rate_limiting import rate_limit_middleware, endpoint_rate_limit_middleware
from middleware.security import security_middleware_handler
from middleware.request_logging import request_logging_middleware
import logging
import traceback
from sqlalchemy.orm import Session

# Router Imports
from routers.v1 import router as v1_router
from routers.v1 import doctors
from routers.v1 import notifications
from routers.v1 import tips
from routers.v1 import reviews
from routers.v1 import appointments 
from routers.v1 import messages

# Model Imports for Seeding
from models.doctor import Specialization 
from models.message import Message
from models.review import Review

def create_app() -> FastAPI:
    setup_logging()
    logger = get_logger(__name__)

    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # ============================================================
    # FIXED: CORS MUST BE ADDED FIRST BEFORE ANY MIDDLEWARE
    # ============================================================
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://bukcare.com",
            "https://www.bukcare.com",
            "https://bukcare.pages.dev",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============================================================
    # Custom Middlewares (Executed AFTER CORS)
    # ============================================================
    app.middleware("http")(request_logging_middleware)
    app.middleware("http")(security_middleware_handler)
    app.middleware("http")(rate_limit_middleware)
    app.middleware("http")(endpoint_rate_limit_middleware)

    # ============================================================
    # ROUTERS
    # ============================================================
    app.include_router(notifications.router, prefix="/v1/notifications", tags=["Notifications"])
    app.include_router(tips.router, prefix="/v1")
    app.include_router(reviews.router, prefix="/v1/reviews", tags=["Reviews"])
    app.include_router(doctors.router, prefix="/v1/doctor", tags=["Doctor"])
    app.include_router(appointments.router, prefix="/v1/appointments", tags=["Appointments"])
    app.include_router(messages.router, prefix="/v1")
    app.include_router(v1_router, prefix="/v1")



    # ============================================================
    # DATABASE SEEDER FUNCTION
    # This runs on startup to ensure "Cardiology" exists (ID 6)
    # instead of creating a specialization literally named "6"
    # ============================================================
    def seed_specializations(db: Session):
        """
        Ensures standard specializations exist in the database.
        """
        standard_specs = [
            "General Practice",     # ID 1
            "Pediatrics",           # ID 2
            "Dermatology",          # ID 3
            "Neurology",            # ID 4
            "Internal Medicine",    # ID 5
            "Cardiology",           # ID 6
            "Psychiatry",           # ID 7
            "Surgery",              # ID 8
            "Orthopedics",          # ID 9
            "Ophthalmology",        # ID 10
            "Obstetrics and Gynecology" # ID 11
        ]

        # Check if table is empty
        try:
            if db.query(Specialization).count() == 0:
                logger.info("Seeding Specializations database...")
                for name in standard_specs:
                    db.add(Specialization(name=name))
                db.commit()
                logger.info("Specializations seeded successfully!")
            else:
                logger.info("Specializations already exist. Skipping seed.")
        except Exception as e:
            logger.error(f"Error seeding specializations: {e}")


    # ============================================================
    # STARTUP TASKS
    # ============================================================
    @app.on_event("startup")
    def startup_tasks():
        # 1. Create Tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully")

        # 2. Run Seeder
        db = SessionLocal()
        try:
            seed_specializations(db)
            # You can add create_admin_if_not_exists() here too if needed
        finally:
            db.close()
        
        logger.info("Startup tasks completed")


    # ================================
    # Exception Handlers
    # ================================
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.detail,
                "status_code": exc.status_code
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Validation error",
                "details": exc.errors(),
                "status_code": 422
            }
        )


    @app.get("/")
    def read_root():
        return {"message": "Welcome to BukCare API"}
    

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logging.error(f"Unhandled exception: {str(exc)}")
        logging.error(f"Traceback: {traceback.format_exc()}")

        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "Internal server error",
                "status_code": 500
            }
        )

    return app

app = create_app()