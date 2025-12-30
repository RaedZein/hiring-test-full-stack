@echo off
REM Development script - starts both frontend and backend servers

echo 🚀 Starting development servers...
echo.

REM Check if dependencies are installed
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

if not exist "web\node_modules" (
    echo 📦 Installing web dependencies...
    cd web
    call npm install
    cd ..
    echo.
)

echo ✅ Starting servers...
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start both servers in new windows
start "Backend Server" cmd /k "cd server && npm start"
start "Frontend Server" cmd /k "cd web && npm start"

echo Both servers started in separate windows!
