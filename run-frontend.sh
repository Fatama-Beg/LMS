#!/bin/bash
echo "======================================================="
echo "🎓 Educore LMS - Frontend Dev Server (Vite)"
echo "======================================================="

if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed! Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

echo "1. Installing dependencies if needed..."
npm install

echo "2. Starting Frontend dev server on http://localhost:5173..."
echo "(Make sure the backend is running on http://localhost:3000)"
npm run client
