/**
 * 🇧🇩 ফ্রন্টএন্ড এপিআই গেটওয়ে ও সার্ভিস লেয়ার (Frontend API Gateway Service)
 * 
 * ইন্টারভিউ ব্যাখ্যা (Interview Talking Points):
 * ১. Singleton Pattern & Request Wrapper:
 *    - `request<T>()` ফাংশনের মাধ্যমে সব HTTP কল সেন্ট্রালাইজ করা হয়েছে।
 *    - স্বয়ংক্রিয়ভাবে `Authorization: Bearer <token>` এবং `x-user-id` হেডার যুক্ত হয়।
 * 
 * ২. সেশন সিকিউরিটি ও লোকাল স্টোরেজ:
 *    - `setActiveUserToken` এবং `clearActiveSession` মেথড ব্যবহার করে সেশন টোকেন হ্যান্ডেল করা হয়।
 * 
 * ৩. এরর ও স্ট্যাটাস হ্যান্ডলিং:
 *    - ব্যাকএন্ড থেকে যেকোনো HTTP 4xx/5xx এরর আসলে তা কাস্টম এরর অবজেক্ট হিসেবে থ্রো করা হয়।
 */

import { User, Course, Lesson, Quiz, QuizSubmission, Enrollment, StudentCourseProgress, BlogPost, PlatformStats, AuditLog, UserSession } from '../types';

let currentSessionToken: string = localStorage.getItem('educore_session_token') || '';
let currentUserId: string = localStorage.getItem('lms_active_user_id') || '';

// 🇧🇩 সেশন টোকেন সেট করার মেথড
export function setActiveUserToken(tokenOrId: string) {
  if (tokenOrId.startsWith('sess_')) {
    currentSessionToken = tokenOrId;
    localStorage.setItem('educore_session_token', tokenOrId);
  } else {
    currentUserId = tokenOrId;
    localStorage.setItem('lms_active_user_id', tokenOrId);
  }
}

// 🇧🇩 লগআউট করার সময় সেশন মুছে ফেলার মেথড
export function clearActiveSession() {
  currentSessionToken = '';
  currentUserId = '';
  localStorage.removeItem('educore_session_token');
  localStorage.removeItem('lms_active_user_id');
}

export function getActiveUserToken(): string {
  return currentSessionToken || currentUserId;
}

function formatApiUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (!clean) return '';
  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/$/, '');
}

const RAW_API_URL = typeof window !== 'undefined'
  ? ((import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.NEXT_PUBLIC_STRAPI_API_URL || (process as any).env?.NEXT_PUBLIC_STRAPI_API_URL || '')
  : (process.env.NEXT_PUBLIC_STRAPI_API_URL || '');

const API_BASE_URL = formatApiUrl(RAW_API_URL);

// 🇧🇩 সার্বজনীন ফেচ রিকোয়েস্ট র‍্যাপার
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : endpoint;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const token = currentSessionToken || currentUserId;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-user-id', currentUserId || token);
    if (currentSessionToken) {
      headers.set('x-session-token', currentSessionToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    data = { message: text || `HTTP ${response.status} ${response.statusText}` };
  }

  if (!response.ok) {
    const errorMsg = data.error?.message || data.error || data.message || `HTTP Error ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // =====================
  // AUTH & SESSIONS
  // =====================
  async getMe(): Promise<{ success: boolean; user: User; session?: UserSession }> {
    return request('/api/auth/me');
  },

  async getSession(): Promise<{ 
    success: boolean; 
    user: User; 
    session: UserSession; 
    environment: { host: string; isLocalhost: boolean; nodeEnv: string; port: number };
    remainingSeconds: number;
    isExpired: boolean;
  }> {
    return request('/api/auth/session');
  },

  async extendSession(minutes: number = 30): Promise<{ success: boolean; message: string; session: UserSession; remainingSeconds: number }> {
    return request('/api/auth/session/extend', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  async setSessionTimeout(timeoutMinutes: number): Promise<{ success: boolean; message: string; session: UserSession }> {
    return request('/api/auth/session/timeout', {
      method: 'POST',
      body: JSON.stringify({ timeoutMinutes }),
    });
  },

  async getUserSessions(): Promise<{ success: boolean; sessions: UserSession[]; currentSessionId: string | null }> {
    return request('/api/auth/sessions');
  },

  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string; terminatedSessionId: string }> {
    return request(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async revokeAllOtherSessions(): Promise<{ success: boolean; message: string; revokedCount: number }> {
    return request('/api/auth/sessions', {
      method: 'DELETE',
    });
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await request<{ success: boolean; message: string }>('/api/auth/logout', {
        method: 'POST',
      });
      clearActiveSession();
      return res;
    } catch (err) {
      clearActiveSession();
      return { success: true, message: 'Logged out locally' };
    }
  },

  // 🇧🇩 ১. ইমেইলে অথেনটিকেশন কোড পাঠানো
  async sendVerificationCode(payload: {
    email: string;
    type: 'login' | 'register';
    name?: string;
    role?: string;
    bio?: string;
  }): Promise<{ success: boolean; message: string; email: string; codePreview?: string; expiresAt?: string }> {
    return request('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 🇧🇩 ২. অথেনটিকেশন কোড ভেরিফাই ও সাইন ইন সম্পন্ন করা
  async verifyCode(payload: {
    email: string;
    code: string;
    timeoutMinutes?: number;
  }): Promise<{ success: boolean; message: string; user: User; token: string; session?: UserSession }> {
    const res = await request<{ success: boolean; message: string; user: User; token: string; session?: UserSession }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      currentUserId = res.user.id;
      localStorage.setItem('lms_active_user_id', res.user.id);
    }
    if (res.token) {
      setActiveUserToken(res.token);
    }
    return res;
  },

  async login(email: string, timeoutMinutes?: number): Promise<{ success: boolean; user: User; token: string; session?: UserSession }> {
    const res = await request<{ success: boolean; user: User; token: string; session?: UserSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, timeoutMinutes }),
    });
    if (res.user) {
      currentUserId = res.user.id;
      localStorage.setItem('lms_active_user_id', res.user.id);
    }
    if (res.token) {
      setActiveUserToken(res.token);
    }
    return res;
  },

  async register(data: { name: string; email: string; role?: string; bio?: string; timeoutMinutes?: number }): Promise<{ success: boolean; user: User; token: string; session?: UserSession }> {
    const res = await request<{ success: boolean; user: User; token: string; session?: UserSession }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.user) {
      currentUserId = res.user.id;
      localStorage.setItem('lms_active_user_id', res.user.id);
    }
    if (res.token) {
      setActiveUserToken(res.token);
    }
    return res;
  },

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    return request('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    return request('/api/users');
  },

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; user: User }> {
    return request(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // =====================
  // COURSES & LESSONS
  // =====================
  async getCourses(): Promise<{ success: boolean; courses: Course[] }> {
    return request('/api/courses');
  },

  async getCourseDetails(id: string): Promise<{ success: boolean; course: Course; lessons: Lesson[]; quiz?: Quiz }> {
    return request(`/api/courses/${id}`);
  },

  async createCourse(data: Partial<Course>): Promise<{ success: boolean; course: Course }> {
    return request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCourse(id: string, data: Partial<Course>): Promise<{ success: boolean; course: Course }> {
    return request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async assignInstructor(courseId: string, instructorId: string): Promise<{ success: boolean; course: Course }> {
    return request(`/api/courses/${courseId}/assign-instructor`, {
      method: 'PATCH',
      body: JSON.stringify({ instructorId }),
    });
  },

  async deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async createLesson(data: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    return request('/api/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLesson(id: string, data: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    return request(`/api/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLesson(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/lessons/${id}`, {
      method: 'DELETE',
    });
  },

  // =====================
  // ENROLLMENTS & PROGRESS
  // =====================
  async enrollCourse(courseId: string): Promise<{ success: boolean; enrollment: Enrollment }> {
    return request('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  async getMyCourses(): Promise<{ success: boolean; courses: (Course & { enrollment: Enrollment; progress: StudentCourseProgress })[] }> {
    return request('/api/enrollments/my');
  },

  async getProgress(courseId: string): Promise<{ success: boolean; progress: StudentCourseProgress }> {
    return request(`/api/progress/${courseId}`);
  },

  async toggleLessonComplete(courseId: string, lessonId: string): Promise<{ success: boolean; progress: StudentCourseProgress }> {
    return request('/api/progress/toggle-lesson', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonId }),
    });
  },

  async getCourseProgressReport(courseId: string): Promise<{ success: boolean; report: any[] }> {
    return request(`/api/courses/${courseId}/progress-report`);
  },

  // =====================
  // QUIZZES & AUTO-GRADING
  // =====================
  async saveQuiz(data: Partial<Quiz>): Promise<{ success: boolean; quiz: Quiz }> {
    return request('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitQuiz(quizId: string, answers: Record<string, string>): Promise<{
    success: boolean;
    submission: QuizSubmission;
    evaluation: any;
  }> {
    return request(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getSubmissions(): Promise<{ success: boolean; submissions: QuizSubmission[] }> {
    return request('/api/quizzes/submissions');
  },

  // =====================
  // BLOG CMS
  // =====================
  async getBlogs(): Promise<{ success: boolean; blogs: BlogPost[] }> {
    return request('/api/blogs');
  },

  async getBlogDetails(id: string): Promise<{ success: boolean; blog: BlogPost }> {
    return request(`/api/blogs/${id}`);
  },

  async createBlog(data: Partial<BlogPost>): Promise<{ success: boolean; blog: BlogPost }> {
    return request('/api/blogs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBlog(id: string, data: Partial<BlogPost>): Promise<{ success: boolean; blog: BlogPost }> {
    return request(`/api/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleBlogStatus(id: string): Promise<{ success: boolean; blog: BlogPost }> {
    return request(`/api/blogs/${id}/status`, {
      method: 'PATCH',
    });
  },

  async deleteBlog(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/blogs/${id}`, {
      method: 'DELETE',
    });
  },

  // =====================
  // STATS & RESET
  // =====================
  async getStats(): Promise<{ success: boolean; stats: PlatformStats }> {
    return request('/api/stats');
  },

  async getAuditLogs(): Promise<{ success: boolean; logs: AuditLog[] }> {
    return request('/api/audit-logs');
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return request('/api/reset-demo', {
      method: 'POST',
    });
  }
};
