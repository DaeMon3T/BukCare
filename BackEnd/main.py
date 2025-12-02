from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from utils.admin import create_admin_if_not_exists
from core.config import settings
from core.database import Base, engine
from core.logging_config import setup_logging, get_logger
from middleware.rate_limiting import rate_limit_middleware, endpoint_rate_limit_middleware
from middleware.security import security_middleware_handler
from middleware.request_logging import request_logging_middleware
import logging
import traceback
from routers.v1 import router as v1_router
from utils.admin import create_admin_if_not_exists

def create_app() -> FastAPI:
    setup_logging()
    logger = get_logger(__name__)

    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # ============================================================
    # ⭐ FIXED: CORS MUST BE ADDED FIRST BEFORE ANY MIDDLEWARE ⭐
    # ============================================================
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "*",
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

    # DB initialization
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    # API routes
    app.include_router(v1_router, prefix="/v1")

    # ✅ Startup event for tasks like creating default admin
    @app.on_event("startup")
    def startup_tasks():
        # ❌ Commented out - implement this if needed
        create_admin_if_not_exists()
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