# LMS Platform - Next.js & Strapi

A full-stack Learning Management System built with Next.js (frontend) and Strapi (backend/CMS) according to the project specifications.

## Overview & Architecture

- **Frontend**: Next.js (React 18, Tailwind CSS, TypeScript, Lucide Icons), deployed on Vercel.
- **Backend**: Strapi v4 headless CMS with Users & Permissions plugin, deployed on Railway.
- **Database**: PostgreSQL (Railway) / SQLite (local dev).

## Role-Based Access Control (RBAC)

The system supports four distinct roles with strict permission boundaries enforced on the backend:

| Action | Admin | Content Manager | Instructor | Student |
|---|:---:|:---:|:---:|:---:|
| Manage users & assign roles | Yes | No | No | No |
| Create / edit / delete any course | Yes | Yes | Own only | No |
| Add / edit / delete lessons | Yes | Yes | Own courses | No |
| Create quizzes | Yes | Yes | Own courses | No |
| View student progress | Yes | Yes | Own courses | Own only |
| Write / manage blog posts | Yes | Yes | No | No |
| Enroll in a course | No | No | No | Yes |
| Take quizzes | No | No | No | Yes |

## Core & Differentiator Features

1. **Authentication & RBAC**:
   - Sign up / login for all four roles.
   - Protected API routes and client-side guards with server-side validation.

2. **Course & Lesson Management**:
   - Course creation with categories, difficulty levels, and cover images.
   - Sequential lessons with support for video URLs and structured markdown content.

3. **Student Experience**:
   - Course browsing and enrollment.
   - Separate "My Courses" section for enrolled courses.
   - Sequential lesson viewer with progress calculation.

4. **Progress Tracking**:
   - Mark lessons complete with automatic progress percentage computation (e.g., 3/5 lessons = 60%).
   - Persistent per-student, per-course progress stored in the database.

5. **Quiz with Auto-Grading**:
   - Multiple-choice questions (MCQs) with points and passing criteria.
   - Server-side auto-grading on submission with immediate score feedback.
   - Past submission history and scores stored per user.

6. **Blog Engine**:
   - Content Managers and Admins can create, edit, and delete blog posts.
   - Draft vs. Published states (drafts hidden from students and public).

7. **Admin Dashboard**:
   - User role management (promote/demote/reassign roles).
   - Platform metrics (total users per role, courses, enrollments).

## Local Development

### 1. Frontend (Next.js)

```bash
cd educore-lms-frontend
npm install
```

Create a `.env.local` file:
```env
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
```

Run the development server:
```bash
npm run dev
```
Visit `http://localhost:3000`.

### 2. Backend (Strapi)

```bash
cd educore-lms-backend
npm install
npm run develop
```
Access the Strapi admin dashboard at `http://localhost:1337/admin`.

## Deployment

- **Frontend (Vercel)**: Import `educore-lms-frontend` repository, set `NEXT_PUBLIC_STRAPI_API_URL` environment variable, and trigger build.
- **Backend (Railway)**: Deploy `educore-lms-backend` repository with a PostgreSQL plugin.

## Demo Accounts

- **Admin**: `admin@lms.com` (Password: `admin123`)
- **Content Manager**: `content@lms.com` (Password: `content123`)
- **Instructor**: `instructor@lms.com` (Password: `instructor123`)
- **Student**: `student@lms.com` (Password: `student123`)
