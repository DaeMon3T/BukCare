from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import Base, engine
from routers.v1 import auth, user_routes, admin
from routers.v1 import auth


def create_app() -> FastAPI:
    app = FastAPI(
        title="BukCare API",
        description="Online Appointment API",
        version="1.0.0"
    )

    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    api_v1_prefix = "/api/v1"
    app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Auth"])
    app.include_router(user_routes.router, prefix=f"{api_v1_prefix}/users", tags=["Users"])
    app.include_router(admin.router, prefix=f"{api_v1_prefix}/admin", tags=["Admin"])  # ✅ added prefix

    return app

app = create_app()
