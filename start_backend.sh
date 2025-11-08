#!/bin/bash

# BukCare Backend Startup Script

echo "🚀 Starting BukCare Backend..."

# Check if we're in the BukCare root directory
if [ ! -d "BackEnd" ]; then
    echo "❌ Error: Please run this script from the BukCare root directory"
    exit 1
fi

# Navigate to backend directory
cd BackEnd || exit

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate


# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default settings."
    echo "📝 Please copy .env.development or .env.production to .env and configure your settings."
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server
echo "🌟 Starting FastAPI server..."
echo "📍 Backend will be available at: http://localhost:8000"
echo "📚 API documentation at: http://localhost:8000/docs"
echo "🔍 Health check at: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
