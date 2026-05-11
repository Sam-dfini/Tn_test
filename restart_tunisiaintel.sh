#!/bin/bash
# TunisiaIntel Restart Script
# This script safely restarts both the Python backend and Node.js frontend

# Function to check if a process is running
is_running() {
  pgrep -f "$1" > /dev/null
}

# Stop Python backend if running
if is_running "python3 -m uvicorn"; then
  echo "Stopping Python backend..."
  pkill -f "python3 -m uvicorn"
  sleep 2
fi

# Stop Node.js frontend if running
if is_running "npm run dev"; then
  echo "Stopping Node.js frontend..."
  pkill -f "npm run dev"
  sleep 2
fi

# Clean up any remaining processes
pkill -f "node.*vite" || true
pkill -f "vite" || true

# Wait for processes to stop
echo "Waiting for processes to stop..."
sleep 3

# Start the application
echo "Starting TunisiaIntel..."
./start_tunisiaintel.sh
