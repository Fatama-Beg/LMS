@echo off
title Educore LMS - Frontend Only
echo =======================================================
echo 🎓 Educore LMS - Frontend Dev Server (Vite)
echo =======================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not found!
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/2] Installing dependencies if needed...
call npm install

echo.
echo [2/2] Launching Frontend on http://localhost:5173...
echo (Ensure the backend server is running on http://localhost:3000)
echo.
call npm run client

pause
