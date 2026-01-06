from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
from dotenv import load_dotenv
# You can keep or remove the top-level imports, but the manual load below is what matters for Alembic here
# from models.users import User 
# from models.review import Review 

# Load .env
load_dotenv()

# Import Base first
from core.database import Base

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

# Load models in dependency order
location_mod = load_module_directly('location', os.path.join(models_path, 'location.py'))
users_mod = load_module_directly('users', os.path.join(models_path, 'users.py'))
doctor_mod = load_module_directly('doctor', os.path.join(models_path, 'doctor.py'))
appointment_mod = load_module_directly('appointment', os.path.join(models_path, 'appointment.py'))
notification_mod = load_module_directly('notification', os.path.join(models_path, 'notification.py'))

# ADDED THIS LINE
review_mod = load_module_directly('review', os.path.join(models_path, 'review.py'))

target_metadata = Base.metadata

# ... rest of your config ...
config = context.config

config.set_main_option(
    "sqlalchemy.url",
    os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+psycopg2://")
)

fileConfig(config.config_file_name)

def run_migrations_offline():
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