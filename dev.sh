#!/bin/bash
# Development script - starts both frontend and backend servers

set -e

echo "🚀 Starting development servers..."
echo ""

# Check if dependencies are installed
if [ ! -d "server/node_modules" ] || [ ! -d "web/node_modules" ]; then
    echo "📦 Installing dependencies..."
    (cd server && npm install)
    (cd web && npm install)
    echo ""
fi

# Start both servers in background
echo "🔵 Starting backend (port 8000)..."
(cd server && npm start) &
SERVER_PID=$!

echo "🟣 Starting frontend (port 3000)..."
(cd web && npm start) &
WEB_PID=$!

# Cleanup on exit
trap "echo ''; echo '🛑 Shutting down...'; kill $SERVER_PID $WEB_PID 2>/dev/null; exit" INT TERM

echo ""
echo "✅ Both servers running!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
