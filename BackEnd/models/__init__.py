"""
Automatically import all model files so that SQLAlchemy Base.metadata
includes every table definition when Alembic runs.
"""

from core.database import Base  # Ensure all models use the same Base

# Import all model modules here
from . import (
    address,
    appointment,
    doctor,
    notification,
    patient,
    users,
)

# Optional: expose Base for convenience
__all__ = ["Base"]