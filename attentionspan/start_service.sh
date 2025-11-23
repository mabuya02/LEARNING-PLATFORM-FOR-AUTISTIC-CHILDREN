#!/bin/bash

# Attention Span Analysis Service Startup Script

echo "🎯 Starting Attention Span Analysis Service..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "attention_service.py" ]; then
    echo "❌ Please run this script from the attentionspan directory"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if dlib model exists
if [ ! -f "shape_predictor_68_face_landmarks.dat" ]; then
    echo "⚠️  Dlib model will be downloaded automatically on first run (~100MB)"
fi

# Start the service
echo "🚀 Starting FastAPI service on http://localhost:8000"
echo "📋 API Documentation will be available at http://localhost:8000/docs"
echo "🔌 WebSocket endpoint: ws://localhost:8000/ws/attention/{session_id}"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

.venv/bin/python attention_service.py