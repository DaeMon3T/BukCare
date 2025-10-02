# core/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings  # make sure your settings have DATABASE_URL

# Database URL example: "postgresql://username:password@localhost:5432/dbname"
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
