#!/usr/bin/env bash

set -e

echo "🧹 Clearing Python cache files..."

# Remove all __pycache__ directories
find . -type d -name "__pycache__" -prune -exec rm -rf {} +

# Remove compiled Python files
find . -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete

echo "✅ Python cache cleared."

# Optional: clear app logs (keep structure)
read -p "Clear application logs? (y/N): " answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    find logs -type f -name "*.log" -delete 2>/dev/null || true
    find Postgres/logs -type f -name "*.log" -delete 2>/dev/null || true
    echo "🗑 Logs cleared."
else
    echo "📄 Logs preserved."
fi

echo "✨ Done."

