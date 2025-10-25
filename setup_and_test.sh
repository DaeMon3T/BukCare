#!/bin/bash

# BukCare Setup and Test Script
# This script sets up the environment and tests the application

echo "🔧 Setting up BukCare Application..."
echo "===================================="

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

# Setup Backend
print_status "Setting up Backend..."
cd BackEnd

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_status "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Please edit BackEnd/.env with your actual configuration"
    else
        print_error "env.example not found. Creating basic .env..."
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

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EOF
    fi
fi

# Create logs directory
mkdir -p logs

# Test backend imports
print_status "Testing backend imports..."
python3 -c "
try:
    import main
    print('✅ Backend imports OK')
except Exception as e:
    print(f'❌ Backend import error: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    print_success "Backend setup completed successfully!"
else
    print_error "Backend setup failed!"
    exit 1
fi

# Setup Frontend
print_status "Setting up Frontend..."
cd ../FrontEnd

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env.local
    else
        print_warning "Creating basic .env.local..."
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
    print_warning "Please edit FrontEnd/.env.local with your actual configuration"
fi

# Test frontend build
print_status "Testing frontend build..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend setup completed successfully!"
else
    print_error "Frontend setup failed!"
    exit 1
fi

# Go back to root directory
cd ..

# Test connection script
print_status "Testing connection script..."
if [ -f "test_connection.py" ]; then
    python3 -c "
try:
    import requests
    print('✅ Connection test dependencies OK')
except Exception as e:
    print(f'❌ Connection test error: {e}')
    exit(1)
"
    if [ $? -eq 0 ]; then
        print_success "Connection test script is ready!"
    else
        print_error "Connection test script failed!"
    fi
else
    print_error "Connection test script not found!"
fi

echo ""
echo "===================================="
print_success "BukCare Setup Completed!"
echo "===================================="
echo ""
echo "📋 Next Steps:"
echo "1. Configure your environment variables:"
echo "   - BackEnd/.env (database, JWT, etc.)"
echo "   - FrontEnd/.env.local (API URL, OAuth, etc.)"
echo ""
echo "2. Start the application:"
echo "   ./start_complete.sh"
echo ""
echo "3. Test the connection:"
echo "   python3 test_connection.py"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""


