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
    """Get database session with proper error handling."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        # Log the error for debugging
        import logging
        logging.error(f"Database error: {str(e)}")
        raise e
    finally:
        try:
            db.close()
        except Exception as close_error:
            import logging
            logging.error(f"Error closing database session: {str(close_error)}")
