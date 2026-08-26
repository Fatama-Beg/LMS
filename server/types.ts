/**
 * 🇧🇩 সার্ভার টাইপস ডেফিনিশন (Server-Side Type Definitions)
 * ব্যাকএন্ড কন্ট্রোলার ও সার্ভিসগুলোর জন্য ডেটা টাইপ।
 */
import { User, UserRole, Course, Lesson, Quiz, QuizSubmission, Enrollment, StudentCourseProgress, BlogPost, AuditLog, UserSession } from '../src/types';

export interface VerificationCode {
  email: string;
  code: string;
  type: 'login' | 'register';
  registrationData?: {
    name: string;
    role: UserRole;
    bio?: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  submissions: QuizSubmission[];
  enrollments: Enrollment[];
  progress: StudentCourseProgress[];
  blogs: BlogPost[];
  auditLogs: AuditLog[];
  sessions: UserSession[];
  verificationCodes?: VerificationCode[];
}

export interface AuthSession {
  user: User;
  token: string;
  session?: UserSession;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}
