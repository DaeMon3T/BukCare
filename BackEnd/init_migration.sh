#!/bin/bash

# ============================================================================
# init_migrations.sh - Initialize Alembic Migrations for BukCare
# ============================================================================
# This script automates the process of setting up database migrations
# Usage: ./init_migrations.sh
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BukCare - Database Migration Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if virtual environment is activated
echo -e "${YELLOW}[1/6] Checking virtual environment...${NC}"
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${RED}Error: Virtual environment is not activated!${NC}"
    echo -e "${YELLOW}Please activate your virtual environment first:${NC}"
    echo -e "  source .venv/bin/activate"
    exit 1
fi
echo -e "${GREEN}✓ Virtual environment active${NC}"
echo ""

# Step 2: Check if alembic is installed
echo -e "${YELLOW}[2/6] Checking Alembic installation...${NC}"
if ! python -c "import alembic" 2>/dev/null; then
    echo -e "${RED}Error: Alembic is not installed!${NC}"
    echo -e "${YELLOW}Installing Alembic...${NC}"
    pip install alembic
fi
echo -e "${GREEN}✓ Alembic is installed${NC}"
echo ""

# Step 3: Initialize database
echo -e "${YELLOW}[3/6] Initializing PostgreSQL database...${NC}"
if [ -f "Postgres/init_db.py" ]; then
    python Postgres/init_db.py
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${YELLOW}⚠ Postgres/init_db.py not found, skipping database creation${NC}"
fi
echo ""

# Step 4: Clean up old migrations (optional - ask user)
echo -e "${YELLOW}[4/6] Checking for existing migrations...${NC}"
if [ -d "alembic/versions" ] && [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo -e "${YELLOW}Found existing migration files:${NC}"
    ls -1 alembic/versions/*.py 2>/dev/null | head -5
    read -p "Do you want to remove old migrations and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing old migrations...${NC}"
        rm -f alembic/versions/*.py
        echo -e "${GREEN}✓ Old migrations removed${NC}"
        
        # Also clear alembic_version table
        echo -e "${YELLOW}Clearing alembic_version table...${NC}"
        python -c "
from core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text('DROP TABLE IF EXISTS alembic_version CASCADE'))
    conn.commit()
print('✓ alembic_version table cleared')
"
    else
        echo -e "${YELLOW}⚠ Keeping existing migrations${NC}"
    fi
else
    echo -e "${GREEN}✓ No existing migrations found${NC}"
fi
echo ""

# Step 5: Create new migration
echo -e "${YELLOW}[5/6] Creating initial migration...${NC}"
alembic revision --autogenerate -m "Initial migration"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration file created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create migration${NC}"
    exit 1
fi
echo ""

# Step 6: Apply migration
echo -e "${YELLOW}[6/6] Applying migration to database...${NC}"
alembic upgrade head
if [ $? -eq 0 ]; then


    echo -e "${GREEN}✓ Migration applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply migration${NC}"
    exit 1
fi
echo ""

# Success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Database migrations completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Create an admin user: ${YELLOW}python create_admin.py${NC}"
echo -e "  2. Start the server: ${YELLOW}fastapi dev main.py${NC}"
echo ""