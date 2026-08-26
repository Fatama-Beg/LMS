@echo off
title Educore Fullstack LMS
echo =======================================================
echo 🎓 Educore Fullstack LMS - Windows Quick Setup & Run
echo =======================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not found!
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/2] Installing required dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install encountered an issue.
    pause
    exit /b 1
)

echo.
echo [2/2] Launching Educore LMS on http://localhost:3000...
echo.
call npm run dev

pause
