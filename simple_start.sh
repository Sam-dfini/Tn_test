#!/bin/bash
# Simple TunisiaIntel Startup Script

# 1. Start the Python backend
cd /home/davey/Desktop/tunisiaintel\ v2/Tn_test
source venv/bin/activate
echo "Starting Python backend on port 8000..."
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# 2. Start the Node.js frontend on port 3001
cd ..
echo "Starting Node.js frontend on port 3001..."
PORT=3001 npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# 3. Open the application in the default browser
sleep 5
echo "TunisiaIntel should now be running:"
echo "- Frontend: http://localhost:3001"
echo "- Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both services."

# 4. Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID
