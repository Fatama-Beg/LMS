export type UserRole = 'admin' | 'content_manager' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  headline?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  interests?: string[];
  notifications?: {
    emailAnnouncements?: boolean;
    quizReminders?: boolean;
    newCourseAlerts?: boolean;
  };
  createdAt: string;
  enrolledCourseIds?: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  ipAddress: string;
  userAgent: string;
  isValid: boolean;
  timeoutMinutes: number;
  isCurrent?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'text' | 'markdown';
  videoUrl?: string;
  content: string;
  order: number;
  durationMinutes: number;
  resources?: { title: string; url: string }[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingPercentage: number;
  timeLimitMinutes?: number;
  createdAt: string;
  createdBy: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  lessonsCount: number;
  totalDurationMinutes: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface StudentCourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  totalLessons: number;
  completedLessonsCount: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastActiveLessonId?: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  status: 'draft' | 'published';
  tags: string[];
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    content_manager: number;
    instructor: number;
    student: number;
  };
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalQuizzesTaken: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  averageQuizScore: number;
}

export type PermissionAction =
  | 'manage_users'
  | 'create_any_course'
  | 'edit_any_course'
  | 'create_own_course'
  | 'edit_own_course'
  | 'delete_course'
  | 'add_lesson'
  | 'create_quiz'
  | 'view_all_progress'
  | 'view_own_course_progress'
  | 'view_own_student_progress'
  | 'manage_blogs'
  | 'enroll_course'
  | 'take_quiz';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}
