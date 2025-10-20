from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Import Base first
from core.database import Base

# Load model files directly WITHOUT going through models/__init__.py
# Use spec_from_file_location to bypass __init__.py entirely
import importlib.util

def load_module_directly(module_name, file_path):
    """Load a Python module directly from a file path, bypassing __init__.py"""
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

# Get the models directory
models_path = os.path.join(os.path.dirname(__file__), '..', 'models')

# Load models in dependency order, directly from files
# This completely bypasses models/__init__.py
location_mod = load_module_directly('location', os.path.join(models_path, 'location.py'))
users_mod = load_module_directly('users', os.path.join(models_path, 'users.py'))
doctor_mod = load_module_directly('doctor', os.path.join(models_path, 'doctor.py'))
appointment_mod = load_module_directly('appointment', os.path.join(models_path, 'appointment.py'))
notification_mod = load_module_directly('notification', os.path.join(models_path, 'notification.py'))

target_metadata = Base.metadata

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url from .env
config.set_main_option(
    "sqlalchemy.url",
    os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+psycopg2://")
)

# Interpret the config file for Python logging
fileConfig(config.config_file_name)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()