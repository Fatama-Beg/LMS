# Educore LMS - Backend (Express & Node.js Engine)

Robust, production-ready RESTful API backend for Educore LMS with 4-Tier Role-Based Access Control (RBAC), Course Management, Lesson Progress Tracking, Automated Quiz Grading, and Blog Engine.

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (.env)
Create a `.env` file in the root of the backend:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=educore_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:3000,https://lms-olive-tau.vercel.app
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Start Production Server
```bash
npm run build
npm start
```

---

## 📡 API Endpoints Overview

### 🔐 Authentication & Session
- `POST /api/auth/login` - User login & JWT issuance
- `POST /api/auth/register` - User registration (Student/Instructor)
- `GET /api/auth/me` - Fetch authenticated user profile
- `POST /api/auth/logout` - Clear session

### 📚 Courses & Modules
- `GET /api/courses` - List published courses (filterable by category, level)
- `GET /api/courses/:id` - Fetch single course with modules & lesson hierarchy
- `POST /api/courses` - Create new course *(Instructor, Content Manager, Admin)*
- `PUT /api/courses/:id` - Update course metadata *(Author or Admin)*
- `DELETE /api/courses/:id` - Remove course *(Admin only)*

### 📝 Lessons & Progress
- `GET /api/lessons/:id` - Get lesson content (Markdown/Video)
- `POST /api/progress/complete` - Mark lesson as completed *(Auto-updates course progress %)*
- `GET /api/progress/:courseId` - Get student's progress and completion status

### 🎯 Quizzes & Auto-Grading Engine
- `GET /api/quizzes/:courseId` - Fetch quiz questions
- `POST /api/quizzes/:quizId/submit` - Server-side instant auto-grading & pass/fail evaluation
- `GET /api/grades` - View student gradebook & submission history

### 📰 Blog & Publishing Engine
- `GET /api/blogs` - Get published articles
- `POST /api/blogs` - Create blog post *(Draft/Publish workflow)*
- `PUT /api/blogs/:id` - Update blog post

### 📊 Admin Analytics & Metrics
- `GET /api/admin/metrics` - Total students, enrollments, completion rates, and platform activity

---

## 🛡️ Role-Based Access Control (RBAC Matrix)

| Role | Browse & Learn | Submit Quiz | Create Course | Publish Blog | Manage Users & System |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Student** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Instructor** | ✅ | ✅ | ✅ (Own) | 📝 (Draft) | ❌ |
| **Content Manager** | ✅ | ✅ | ✅ | ✅ (Publish) | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ (Full Access) |

---

## 🚢 Deployment Guide (Railway / Render / VPS)

1. Connect your GitHub repository (`https://github.com/Fatama-Beg/LMS-Backend.git`) to **Railway** or **Render**.
2. Set the **Build Command** to: `npm run build`
3. Set the **Start Command** to: `npm start`
4. Add the required Environment Variables (`PORT`, `JWT_SECRET`, `CLIENT_URL`).
5. Copy your deployed backend URL and set it in your Vercel frontend environment variable:
   `NEXT_PUBLIC_STRAPI_API_URL=https://your-backend-url.up.railway.app`
