#!/bin/bash

# Asteroid Impact Simulator - Backend Startup Script

echo "🌍 Starting Asteroid Impact Simulator Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Set default NASA API key if not set
if [ -z "$NASA_API_KEY" ]; then
    echo "⚠️  NASA_API_KEY not set. Using demo key (limited requests)."
    echo "   To use your own key: export NASA_API_KEY='your_key_here'"
fi

# Start the FastAPI server
echo "🚀 Starting FastAPI server..."
cd backend
python3 main.py
