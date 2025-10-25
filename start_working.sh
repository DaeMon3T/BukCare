#!/bin/bash

# BukCare Working Startup Script
# This script ensures everything is working before starting

echo "🚀 Starting BukCare Application (Working Version)..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "BackEnd/main.py" ] || [ ! -f "FrontEnd/package.json" ]; then
    print_error "Please run this script from the BukCare root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 2
    fi
}

# Clean up any existing processes
print_status "Cleaning up existing processes..."
kill_port 8000
kill_port 5173

# Setup Backend
print_status "Setting up Backend..."
cd BackEnd

# Activate virtual environment
if [ -d "venv" ]; then
    print_status "Activating virtual environment..."
    source venv/bin/activate
else
    print_error "Virtual environment not found. Please run ./setup_and_test.sh first"
    exit 1
fi

# Test backend imports
print_status "Testing backend imports..."
python3 -c "import main; print('Backend imports OK')" 2>/dev/null
if [ $? -ne 0 ]; then
    print_error "Backend imports failed. Please check the setup."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating basic configuration..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/bukcare

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
EOF
fi

# Create logs directory
mkdir -p logs

# Start backend in background
print_status "Starting backend server..."
nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 8

# Test backend health
print_status "Testing backend health..."
for i in {1..5}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        print_success "Backend is healthy!"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "Backend failed to start properly"
            print_error "Check logs/backend.log for details"
            exit 1
        fi
        print_status "Waiting for backend... (attempt $i/5)"
        sleep 2
    fi
done

# Setup Frontend
print_status "Setting up Frontend..."
cd ../FrontEnd

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_error "node_modules not found. Please run ./setup_and_test.sh first"
    exit 1
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Creating basic configuration..."
    cat > .env.local << EOF
# Backend API URL
VITE_API_URL=http://localhost:8000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Application Configuration
VITE_APP_NAME=BukCare
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEBUG=true
EOF
fi

# Start frontend in background
print_status "Starting frontend server..."
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 10

# Test frontend
print_status "Testing frontend..."
for i in {1..5}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        print_success "Frontend is accessible!"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "Frontend failed to start properly"
            print_error "Check frontend.log for details"
            exit 1
        fi
        print_status "Waiting for frontend... (attempt $i/5)"
        sleep 2
    fi
done

# Go back to root directory
cd ..

# Test connection
print_status "Testing application connection..."
if [ -f "test_connection.py" ]; then
    python3 test_connection.py
    if [ $? -eq 0 ]; then
        print_success "Connection test passed!"
    else
        print_warning "Connection test failed, but application is running"
    fi
fi

# Display status
echo ""
echo "=================================================="
print_success "BukCare Application Started Successfully!"
echo "=================================================="
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/health"
echo ""
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "📊 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: BackEnd/logs/backend.log"
echo "   Frontend: frontend.log"
echo ""
echo "🛑 To stop the application:"
echo "   ./stop_complete.sh"
echo ""
echo "Press Ctrl+C to view logs, or run './stop_complete.sh' to stop"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    print_status "Stopping BukCare Application..."
    
    if [ -f "BackEnd/backend.pid" ]; then
        BACKEND_PID=$(cat BackEnd/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
        fi
        rm -f BackEnd/backend.pid
    fi
    
    if [ -f "FrontEnd/frontend.pid" ]; then
        FRONTEND_PID=$(cat FrontEnd/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
        fi
        rm -f FrontEnd/frontend.pid
    fi
    
    # Kill any remaining processes on ports
    kill_port 8000
    kill_port 5173
    
    print_success "Application stopped successfully!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
print_status "Application is running. Press Ctrl+C to stop."
echo ""

# Show recent logs
if [ -f "BackEnd/logs/backend.log" ]; then
    print_status "Recent backend logs:"
    tail -n 5 BackEnd/logs/backend.log
    echo ""
fi

if [ -f "frontend.log" ]; then
    print_status "Recent frontend logs:"
    tail -n 5 frontend.log
    echo ""
fi

# Wait for user interrupt
while true; do
    sleep 1
done


