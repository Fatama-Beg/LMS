/**
 * 🎓 Strapi REST API Service Client
 * 
 * This service provides seamless integration with Strapi Headless CMS API endpoints
 * (/api/courses, /api/lessons, /api/quizzes, /api/enrollments, /api/blogs)
 * adhering to the Next.js + Strapi mandatory tech stack specifications.
 */

import { Course, Lesson, Quiz, QuizSubmission, BlogPost, User } from '../types';

function formatApiUrl(url?: string): string {
  if (!url || typeof url !== 'string') return 'http://localhost:1337';
  let clean = url.trim();
  if (!clean) return 'http://localhost:1337';
  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/$/, '');
}

const RAW_STRAPI_URL = typeof window !== 'undefined' 
  ? ((import.meta as any).env?.VITE_STRAPI_API_URL || (import.meta as any).env?.NEXT_PUBLIC_STRAPI_API_URL || (process as any).env?.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337')
  : (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337');

const STRAPI_BASE_URL = formatApiUrl(RAW_STRAPI_URL);

export async function fetchFromStrapi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('strapi_jwt') : null;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${STRAPI_BASE_URL}/api/${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.error?.message || json.message || `Strapi Error: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return json;
}

// 📚 Course Operations (Strapi /api/courses)
export const strapiCourses = {
  async getAll(): Promise<{ data: Array<{ id: number; attributes: Course }> }> {
    return fetchFromStrapi('courses?populate=*');
  },

  async getById(id: string | number): Promise<{ data: { id: number; attributes: Course } }> {
    return fetchFromStrapi(`courses/${id}?populate[lessons]=*&populate[quiz]=*&populate[instructor]=*`);
  },

  async create(courseData: Partial<Course>): Promise<{ data: any }> {
    return fetchFromStrapi('courses', {
      method: 'POST',
      body: JSON.stringify({ data: courseData }),
    });
  },

  async update(id: string | number, courseData: Partial<Course>): Promise<{ data: any }> {
    return fetchFromStrapi(`courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: courseData }),
    });
  },

  async delete(id: string | number): Promise<{ data: any }> {
    return fetchFromStrapi(`courses/${id}`, {
      method: 'DELETE',
    });
  }
};

// 🎬 Lesson Operations (Strapi /api/lessons)
export const strapiLessons = {
  async getByCourse(courseId: string | number): Promise<{ data: Array<{ id: number; attributes: Lesson }> }> {
    return fetchFromStrapi(`lessons?filters[course][id][$eq]=${courseId}&sort=order:asc`);
  },

  async create(lessonData: Partial<Lesson>): Promise<{ data: any }> {
    return fetchFromStrapi('lessons', {
      method: 'POST',
      body: JSON.stringify({ data: lessonData }),
    });
  },

  async update(id: string | number, lessonData: Partial<Lesson>): Promise<{ data: any }> {
    return fetchFromStrapi(`lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: lessonData }),
    });
  },

  async delete(id: string | number): Promise<{ data: any }> {
    return fetchFromStrapi(`lessons/${id}`, {
      method: 'DELETE',
    });
  }
};

// 📝 Quiz & Auto-Grading (Strapi /api/quizzes)
export const strapiQuizzes = {
  async getByCourse(courseId: string | number): Promise<{ data: { id: number; attributes: Quiz } }> {
    return fetchFromStrapi(`quizzes?filters[course][id][$eq]=${courseId}`);
  },

  async submitQuiz(quizId: string | number, answers: Record<string, number>): Promise<{
    success: boolean;
    data: {
      score: number;
      totalPoints: number;
      percentage: number;
      isPassed: boolean;
      submissionId: string | number;
    };
  }> {
    return fetchFromStrapi(`quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }
};

// 📈 Progress & Enrollments (Strapi /api/enrollments)
export const strapiEnrollments = {
  async enroll(courseId: string | number): Promise<{ success: boolean; data: any }> {
    return fetchFromStrapi('enrollments', {
      method: 'POST',
      body: JSON.stringify({ data: { course: courseId } }),
    });
  },

  async updateProgress(courseId: string | number, completedLessonIds: string[]): Promise<{
    success: boolean;
    data: { progressPercent: number; completedLessonIds: string[] };
  }> {
    return fetchFromStrapi('enrollments/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId, completedLessonIds }),
    });
  }
};

// 📰 Blog CMS (Strapi /api/blogs)
export const strapiBlogs = {
  async getAll(includeDrafts = false): Promise<{ data: Array<{ id: number; attributes: BlogPost }> }> {
    const publicationState = includeDrafts ? 'preview' : 'live';
    return fetchFromStrapi(`blogs?publicationState=${publicationState}&populate=*&sort=createdAt:desc`);
  },

  async getBySlug(slug: string): Promise<{ data: { id: number; attributes: BlogPost } }> {
    return fetchFromStrapi(`blogs?filters[slug][$eq]=${slug}&populate=*`);
  },

  async create(blogData: Partial<BlogPost>): Promise<{ data: any }> {
    return fetchFromStrapi('blogs', {
      method: 'POST',
      body: JSON.stringify({ data: blogData }),
    });
  },

  async update(id: string | number, blogData: Partial<BlogPost>): Promise<{ data: any }> {
    return fetchFromStrapi(`blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: blogData }),
    });
  },

  async delete(id: string | number): Promise<{ data: any }> {
    return fetchFromStrapi(`blogs/${id}`, {
      method: 'DELETE',
    });
  }
};
