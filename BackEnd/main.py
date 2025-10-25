from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from core.config import settings
from core.database import Base, engine
from core.logging_config import setup_logging, get_logger
from middleware.rate_limiting import rate_limit_middleware, endpoint_rate_limit_middleware
from middleware.security import security_middleware_handler
from middleware.request_logging import request_logging_middleware
import logging
import traceback

# ✅ Import the full v1 router (which includes auth + doctors)
from routers.v1 import router as v1_router

def create_app() -> FastAPI:
    # Setup logging
    setup_logging()
    logger = get_logger(__name__)
    
    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # Add middleware (order matters - first added is outermost)
    app.middleware("http")(request_logging_middleware)
    app.middleware("http")(security_middleware_handler)
    app.middleware("http")(rate_limit_middleware)
    app.middleware("http")(endpoint_rate_limit_middleware)

    # ✅ Create all tables in the database
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    # ✅ Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ✅ Register versioned API routes
    app.include_router(v1_router, prefix="/api/v1")

    # Health check endpoint
    @app.get("/health")
    def health_check():
        return {"status": "healthy", "message": "BukCare API is running"}

    # Global exception handlers
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
