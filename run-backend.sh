#!/bin/bash
echo "======================================================="
echo "🎓 Educore LMS - Backend API Server (Express)"
echo "======================================================="

if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed! Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

echo "1. Installing dependencies..."
npm install

echo "2. Starting Backend API server on http://localhost:3000..."
npm run server
