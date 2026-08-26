#!/bin/bash
echo "======================================================="
echo "🎓 Educore LMS - Fullstack All-in-One Dev Server"
echo "======================================================="

if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed! Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

echo "1. Installing dependencies..."
npm install

echo "2. Starting Fullstack LMS on http://localhost:3000..."
npm run dev
