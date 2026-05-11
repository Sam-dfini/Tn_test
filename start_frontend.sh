#!/bin/bash
# Start TunisiaIntel frontend on a custom port

# Kill any existing processes
pkill -f "node.*vite" || true
pkill -f "vite" || true
pkill -f "tsx server.ts" || true

# Wait for processes to stop
sleep 3

# Start the frontend on port 3001
cd /home/davey/Desktop/tunisiaintel\ v2/Tn_test
PORT=3001 npm run dev
