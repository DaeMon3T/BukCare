from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

import logging
import traceback
from sqlalchemy.orm import Session

from utils.admin import create_admin_if_not_exists
from core.config import settings
from core.database import engine, SessionLocal, Base
from core.logging_config import setup_logging, get_logger

from middleware.rate_limiting import (
    rate_limit_middleware,
    endpoint_rate_limit_middleware,
)
from middleware.security import security_middleware_handler
from middleware.request_logging import request_logging_middleware

# Routers
from routers.v1 import router as v1_router

# Models (used for seeding)
from models.doctor import Specialization


def create_app() -> FastAPI:
    setup_logging()
    logger = get_logger(__name__)

    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0",
    )

    # ============================================================
    # CORS (MUST be first)
    # ============================================================
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://192.168.4.147:5173",
            "https://county-elsewhere-voter.ngrok-free.dev",
            "https://bukcare.com",
            "https://www.bukcare.com",
            "https://bukcare.pages.dev",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============================================================
    # Custom Middlewares
    # ============================================================
    app.middleware("http")(request_logging_middleware)
    app.middleware("http")(security_middleware_handler)
    app.middleware("http")(rate_limit_middleware)
    app.middleware("http")(endpoint_rate_limit_middleware)

    # ============================================================
    # Routers — every v1 endpoint is registered inside routers/v1/__init__.py
    # ============================================================
    app.include_router(v1_router, prefix="/v1")

    # ============================================================
    # DATABASE SEEDER
    # ============================================================
    def seed_specializations(db: Session):
        standard_specs = [
            "General Practice",
            "Cardiology",
            "Neurology",
            "Pediatrics",
            "Orthopedics",
            "Ophthalmology",
            "Dermatology",
            "Internal Medicine",
            "Psychiatry",
            "Surgery",
            "Obstetrics and Gynecology",
        ]

        try:
            if db.query(Specialization).count() == 0:
                logger.info("Seeding specializations...")
                for name in standard_specs:
                    db.add(Specialization(name=name))
                db.commit()
                logger.info("Specializations seeded successfully")
            else:
                logger.info("Specializations already exist — skipping")
        except Exception as e:
            logger.error(f"Specialization seeding failed: {e}", exc_info=True)

    # ============================================================
    # STARTUP TASKS
    # ============================================================
    @app.on_event("startup")
    def startup_tasks():
        # 1. Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully")

        # 2. Seed data
        db = SessionLocal()
        try:
            seed_specializations(db)
        finally:
            db.close()

        # 3. Create default admin
        create_admin_if_not_exists()

        logger.info("Startup tasks completed")


    # ============================================================
    # Exception Handlers
    # ============================================================
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.detail,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Validation error",
                "details": exc.errors(),
                "status_code": 422,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logging.error(f"Unhandled exception: {exc}")
        logging.error(traceback.format_exc())

        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "Internal server error",
                "status_code": 500,
            },
        )

    @app.get("/")
    def read_root():
        return {"message": "Welcome to BukCare API"}

    return app


app = create_app()