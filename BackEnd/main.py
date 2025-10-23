from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import Base, engine

# ✅ Import the full v1 router (which includes auth + doctors)
from routers.v1 import router as v1_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # ✅ Create all tables in the database
    Base.metadata.create_all(bind=engine)

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

    return app

app = create_app()
