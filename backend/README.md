# Educore LMS - Strapi Headless CMS Backend

This is the backend engine for Educore LMS built with Strapi v4, ready for deployment on Railway with a PostgreSQL database.

## Features

- **Users & Permissions Plugin**: Pre-configured with Admin, Content Manager, Instructor, and Student roles.
- **REST Endpoints**:
  - `/api/courses`: Course collection with relationships to Lessons and Quizzes.
  - `/api/lessons`: Sequential lesson contents supporting video and markdown.
  - `/api/quizzes`: Quizzes with questions and passing criteria.
  - `/api/quizzes/:id/submit`: Custom controller endpoint for server-side auto-grading.
  - `/api/blogs`: Blog posts with Draft & Publish state handling.

## Deployment on Railway

1. Push this `backend` folder to a GitHub repository.
2. In Railway, click **New Project** ➔ **Deploy from GitHub repo**.
3. Add a **PostgreSQL** database.
4. Set the following environment variables:
   - `DATABASE_CLIENT`: `postgres`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `APP_KEYS`: `<comma-separated-random-keys>`
   - `API_TOKEN_SALT`: `<random-salt>`
   - `ADMIN_JWT_SECRET`: `<random-jwt-secret>`
   - `JWT_SECRET`: `<random-jwt-secret>`
5. Your Strapi backend will be live on your Railway domain!
