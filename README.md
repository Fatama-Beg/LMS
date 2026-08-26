# 🎓 Educore — Fullstack Learning Management System (LMS)

A production-ready Fullstack LMS built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Express REST API** with disk-persisted repository storage and zero external database configuration requirements.

---

## 🚀 How to Run (কোর্স প্ল্যাটফর্ম রান করার নির্দেশিকা)

You can run this project in **two ways**:

### Option 1: Run Fullstack All-in-One (সবকিছু একসাথে রান করা) — Recommended
In your VS Code terminal, run:
```bash
npm install
npm run dev
```
👉 Open your browser at: **`http://localhost:3000`**

---

### Option 2: Run Frontend & Backend Separately (ফ্রন্টএন্ড ও ব্যাকএন্ড আলাদাভাবে রান করা)

#### Step 1: Start the Backend Server (টার্মিনাল ১: ব্যাকএন্ড রান)
Open a new terminal in VS Code and run:
```bash
npm run server
```
*Or double click on `run-backend.bat` (Windows) / run `./run-backend.sh` (Mac/Linux).*  
👉 Backend API will be active on **`http://localhost:3000`**.

#### Step 2: Start the Frontend Server (টার্মিনাল ২: ফ্রন্টএন্ড রান)
Open a second terminal in VS Code and run:
```bash
npm run client
```
*Or double click on `run-frontend.bat` (Windows) / run `./run-frontend.sh` (Mac/Linux).*  
👉 Frontend UI will start on **`http://localhost:5173`** and automatically proxy all API requests to the backend!

---

## 🔑 User Authentication & Role Portals (ভূমিকা অনুযায়ী প্রবেশ)

Upon launching the app, you will see a dedicated **Authentication Gateway** where you can:
1. **১-ক্লিক রোল লগইন (1-Click Instant Role Portals)**:
   - 👑 **Admin**: `admin@lms.com` ➔ Direct access to **Admin Governance & Audit Dashboard**
   - 🎓 **Instructor**: `instructor@lms.com` ➔ Direct access to **Course Studio & Quiz Creator**
   - 📝 **Content Manager**: `content@lms.com` ➔ Direct access to **Course Review & Blog CMS**
   - 🎒 **Student**: `student@lms.com` ➔ Direct access to **Course Catalog & Enrolled Lessons**
2. **ইমেইল লগইন (Email Login)**: Enter your registered email and select session timeout duration.
3. **নতুন একাউন্ট (Register New Account)**: Create a new account with your chosen role (Student, Instructor, Content Manager, Admin) and automatically enter that role's dashboard.

---

## 🛠️ Project Structure

```
├── src/
│   ├── components/         # Reusable UI components (Navbar, Modals, Session, Export)
│   ├── context/            # React Context (AuthContext with session control)
│   ├── services/           # Frontend API client (services/api.ts)
│   ├── views/              # Main App views (AuthView, Catalog, Lesson Player, Studio, Blog, Admin, Profile)
│   ├── types.ts            # Core TypeScript interfaces (User, Course, Quiz, Progress, Blog)
│   ├── App.tsx             # Main routing and role-based viewport switcher
│   ├── main.tsx            # React application entry point
│   └── index.css           # Global Tailwind CSS stylesheet
│
├── server/
│   ├── middleware/         # RBAC policy guards & token validation
│   ├── repositories/       # Database repository with disk persistence
│   ├── services/           # Auto-grading, progress calculation, blog services
│   └── types.ts            # Server-side TypeScript interfaces
│
├── data/
│   └── lms-store.json      # Persistent JSON data store (courses, progress, submissions)
│
├── run-frontend.bat        # Windows 1-click frontend launcher
├── run-backend.bat         # Windows 1-click backend launcher
├── run-fullstack.bat       # Windows 1-click fullstack launcher
├── run-frontend.sh         # Linux/Mac frontend launcher
├── run-backend.sh          # Linux/Mac backend launcher
├── run-fullstack.sh        # Linux/Mac fullstack launcher
├── server.ts               # Express REST API backend server & Vite integration
├── package.json            # Scripts & dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite frontend configuration with API proxy
```

---

## 📦 Production Build & Deployment

To build the self-contained production bundle:
```bash
npm run build
```

To run the production server:
```bash
npm run start
```
