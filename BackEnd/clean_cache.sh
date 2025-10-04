#!/bin/bash

# ============================================================================
# clean_cache.sh - Python Project Cleanup Script
# ============================================================================
# Removes cache files, build artifacts, and temporary files
# Safe to run repeatedly without damaging project files
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Python Project Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Counter for deleted items
DELETED_COUNT=0

# Function to count and delete
delete_items() {
    local pattern=$1
    local description=$2
    local type=$3  # 'f' for file, 'd' for directory
    
    if [ "$type" == "d" ]; then
        COUNT=$(find . -type d -name "$pattern" 2>/dev/null | wc -l)
    else
        COUNT=$(find . -type f -name "$pattern" 2>/dev/null | wc -l)
    fi
    
    if [ "$COUNT" -gt 0 ]; then
        echo -e "${YELLOW}Removing $description... ($COUNT found)${NC}"
        if [ "$type" == "d" ]; then
            find . -type d -name "$pattern" -exec rm -rf {} + 2>/dev/null || true
        else
            find . -type f -name "$pattern" -delete 2>/dev/null || true
        fi
        DELETED_COUNT=$((DELETED_COUNT + COUNT))
        echo -e "${GREEN}✓ Removed $COUNT $description${NC}"
    else
        echo -e "${GREEN}✓ No $description found${NC}"
    fi
}

# Python cache files
echo -e "${BLUE}[1/4] Python Cache Files${NC}"
delete_items "__pycache__" "Python cache directories" "d"
delete_items "*.pyc" "compiled Python files (.pyc)" "f"
delete_items "*.pyo" "optimized Python files (.pyo)" "f"
delete_items "*.pyd" "Python dynamic modules (.pyd)" "f"
echo ""

# IDE and editor files
echo -e "${BLUE}[2/4] IDE & Editor Files${NC}"
delete_items ".vscode" "VS Code directories" "d"
delete_items "*.swp" "Vim swap files" "f"
delete_items "*.swo" "Vim swap files" "f"
delete_items ".DS_Store" "macOS metadata files" "f"
delete_items "*~" "backup files" "f"
echo ""

# Build and distribution artifacts
echo -e "${BLUE}[3/4] Build Artifacts${NC}"
delete_items "*.egg-info" "egg-info directories" "d"
delete_items "dist" "distribution directories" "d"
delete_items "build" "build directories" "d"
delete_items ".eggs" "eggs directories" "d"
echo ""

# Test and coverage files
echo -e "${BLUE}[4/4] Test Artifacts${NC}"
delete_items ".coverage" "coverage files" "f"
delete_items "htmlcov" "HTML coverage reports" "d"
delete_items ".pytest_cache" "pytest cache" "d"
delete_items ".mypy_cache" "mypy cache" "d"
delete_items ".ruff_cache" "ruff cache" "d"
delete_items ".tox" "tox directories" "d"
echo ""

# Alembic bytecode (optional - uncomment if needed)
# echo -e "${BLUE}[5/5] Alembic Cache${NC}"
# if [ -d "alembic/versions/__pycache__" ]; then
#     rm -rf alembic/versions/__pycache__
#     echo -e "${GREEN}✓ Removed Alembic cache${NC}"
# fi
# echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
if [ "$DELETED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Cleanup complete! Removed $DELETED_COUNT items${NC}"
else
    echo -e "${GREEN}✓ Project already clean!${NC}"
fi
echo -e "${GREEN}========================================${NC}"
echo ""

# Show disk space saved (optional)
if command -v du &> /dev/null; then
    CURRENT_SIZE=$(du -sh . 2>/dev/null | cut -f1)
    echo -e "${BLUE}Current project size: $CURRENT_SIZE${NC}"
fi