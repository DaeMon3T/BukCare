#!/bin/bash

# BukCare Frontend Startup Script

echo "🚀 Starting BukCare Frontend..."

# Check if we're in the right directory
if [ ! -f "FrontEnd/package.json" ]; then
    echo "❌ Error: Please run this script from the BukCare root directory"
    exit 1
fi

# Navigate to frontend directory
cd FrontEnd

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found."
    echo "📝 Please copy env.example to .env.local and configure your settings."
    echo "🔧 Creating basic .env.local with default values..."
    cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APP_NAME=BukCare
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
EOF
fi

# Start the development server
echo "🌟 Starting Vite development server..."
echo "📍 Frontend will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
