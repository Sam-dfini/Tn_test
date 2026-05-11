#!/bin/bash
# TunisiaIntel Startup Script
# This script starts both the Python backend and the Node.js frontend

# Function to check if a port is in use
port_in_use() {
  nc -z localhost "$1"
}

# Function to kill process using a port
kill_port() {
  if port_in_use "$1"; then
    echo "Port $1 is in use. Killing process..."
    fuser -k "$1"/tcp
    sleep 2
  fi
}

# Clean up any existing processes on the required ports
kill_port 3000  # Frontend
kill_port 8000  # Backend

# Start the Python backend
start_backend() {
  echo "Starting Python backend intelligence engine..."
  source venv/bin/activate
  cd backend || exit 1
  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
  BACKEND_PID=$!
  cd ..
  echo "Backend started with PID: $BACKEND_PID"
}

# Start the Node.js frontend
start_frontend() {
  echo "Starting Node.js frontend..."
  npm run dev &
  FRONTEND_PID=$!
  echo "Frontend started with PID: $FRONTEND_PID"
}

# Start both services
start_backend
start_frontend

# Function to clean up on exit
cleanup() {
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Services stopped."
}

# Trap Ctrl+C and other termination signals
trap cleanup EXIT INT TERM

# Wait for both services to be ready
echo "Waiting for services to start..."
sleep 5

# Open the application in the default browser
if command -v xdg-open &> /dev/null; then
  echo "Opening TunisiaIntel in your browser..."
  xdg-open http://localhost:3000
fi

# Keep the script running
echo "TunisiaIntel is now running!"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8000"
echo "Press Ctrl+C to stop both services."

# Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID
