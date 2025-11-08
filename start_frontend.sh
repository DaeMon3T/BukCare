#!/bin/bash

# BukCare Frontend Startup Script

echo "🚀 Starting BukCare Frontend..."

# Navigate to frontend directory
cd FrontEnd || { echo "❌ FrontEnd directory not found!"; exit 1; }

# Start the development server
npm run dev
