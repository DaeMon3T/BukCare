from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import Base, engine

# Import only the auth router
from routers.v1 import auth

def create_app() -> FastAPI:
    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API prefix
    api_v1_prefix = "/api/v1"

    # Only include auth routes for now
    app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Authentication"])

    return app

app = create_app()
