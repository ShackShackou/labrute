#!/bin/bash
echo "Starting La Brute in development mode..."

# Start backend
echo "Starting backend server..."
cd server && node lib/main.js &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../client && npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait