/**
 * 🇧🇩 বাংলা ব্যাখ্যা (Bengali Documentation):
 * এই ফাইলে আমাদের লার্নিং ম্যানেজমেন্ট সিস্টেম (LMS) এর সমস্ত ডেটা টাইপ এবং ইন্টারফেস সংজ্ঞায়িত করা হয়েছে।
 * ৪টি রোল: 'admin', 'content_manager', 'instructor', 'student'
 * পারমিশন ম্যাট্রিক্স অনুযায়ী কঠোরভাবে টাইপ চেকিং নিশ্চিত করা হয়েছে।
 */

// 🇧🇩 ব্যবহারকারীর ৪টি নির্দিষ্ট রোল
export type UserRole = 'admin' | 'content_manager' | 'instructor' | 'student';

// 🇧🇩 ব্যবহারকারীর প্রোফাইল ইন্টারফেস
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
  enrolledCourseIds?: string[]; // student দের জন্য এনরোল করা কোর্সের তালিকা
}

// 🇧🇩 লোকালহোস্ট ও প্রডাকশন সেশন কন্ট্রোল ইন্টারফেস (Localhost & Production Session Control)
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

// 🇧🇩 লেসনের প্রকারভেদ ও ডেটা মডেল
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'text' | 'markdown';
  videoUrl?: string; // e.g. YouTube / Vimeo / Direct Video Link
  content: string;   // Text or Markdown body
  order: number;     // ক্রমানুসারে (Sequential) লেসন প্রদর্শনের জন্য
  durationMinutes: number;
  resources?: { title: string; url: string }[];
}

// 🇧🇩 এমসিকিউ (MCQ) কুইজের প্রশ্নের বিকল্প ও সঠিক উত্তর
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string; // সঠিক উত্তরের আইডি (অটো-গ্রেডিং এর জন্য)
  explanation?: string;    // উত্তরের ব্যাখ্যা
  points: number;
}

// 🇧🇩 কোর্সের সাথে সংযুক্ত কুইজ
export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingPercentage: number; // e.g. 70%
  timeLimitMinutes?: number;
  createdAt: string;
  createdBy: string; // User ID
}

// 🇧🇩 কুইজ সাবমিশন ও অটো-গ্রেডিং ফলাফল
export interface QuizSubmission {
  id: string;
  quizId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>; // questionId -> selectedOptionId
  score: number;                   // অর্জিত পয়েন্ট
  totalPoints: number;            // সর্বমোট পয়েন্ট
  percentage: number;             // শতকরা হার
  isPassed: boolean;              // পাস বা ফেল
  submittedAt: string;
}

// 🇧🇩 কোর্সের মূল ডেটা মডেল
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

// 🇧🇩 কোর্স এনরোলমেন্ট ইন্টারফেস
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

// 🇧🇩 প্রোগ্রেস ট্র্যাকিং মডেল (Progress Tracking)
export interface StudentCourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessonIds: string[]; // সম্পন্ন হওয়া লেসনগুলোর আইডি
  totalLessons: number;
  completedLessonsCount: number;
  progressPercentage: number;   // হিসাব: (completed / total) * 100
  isCompleted: boolean;
  lastActiveLessonId?: string;
  updatedAt: string;
}

// 🇧🇩 ব্লগ পোস্ট মডেল (Blog CMS with Draft/Publish)
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
  status: 'draft' | 'published'; // ড্রাফট নাকি পাবলিশড
  tags: string[];
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 🇧🇩 প্ল্যাটফর্মের সামগ্রিক পরিসংখ্যান (Admin Dashboard Stats)
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

// 🇧🇩 পারমিশন ম্যাট্রিক্স অ্যাকশন তালিকা
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

// 🇧🇩 অডিট লগ (Audit Activity Log)
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}
