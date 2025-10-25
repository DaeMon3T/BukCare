#!/bin/bash

# BukCare Complete Stop Script
# This script stops both backend and frontend processes

echo "🛑 Stopping BukCare Application..."
echo "=================================="

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

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        print_status "Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 1
    else
        print_status "No process found on port $port"
    fi
}

# Stop backend
print_status "Stopping backend..."
if [ -f "BackEnd/backend.pid" ]; then
    BACKEND_PID=$(cat BackEnd/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "Stopping backend process (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_warning "Force killing backend process..."
            kill -9 $BACKEND_PID
        fi
    fi
    rm -f BackEnd/backend.pid
fi

# Stop frontend
print_status "Stopping frontend..."
if [ -f "FrontEnd/frontend.pid" ]; then
    FRONTEND_PID=$(cat FrontEnd/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping frontend process (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_warning "Force killing frontend process..."
            kill -9 $FRONTEND_PID
        fi
    fi
    rm -f FrontEnd/frontend.pid
fi

# Kill any remaining processes on ports
print_status "Cleaning up ports..."
kill_port 8000
kill_port 5173

# Clean up log files
print_status "Cleaning up log files..."
rm -f frontend.log
rm -f BackEnd/backend.pid
rm -f FrontEnd/frontend.pid

print_success "BukCare Application stopped successfully!"
echo ""
echo "All processes have been terminated."
echo "Ports 8000 and 5173 are now free."


