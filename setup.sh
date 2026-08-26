#!/bin/bash
echo "======================================================="
echo "🎓 Educore Fullstack LMS - Quick Setup & Run Script"
echo "======================================================="

echo "1. Checking Node.js..."
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed! Please install Node.js (v18 or higher) from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node -v)"

echo "2. Installing dependencies..."
npm install

echo "3. Starting development server on http://localhost:3000..."
npm run dev
