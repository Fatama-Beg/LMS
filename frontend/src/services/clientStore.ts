import initialData from '../data/initialData.json';
import { 
  User, Course, Lesson, Quiz, QuizSubmission, 
  Enrollment, StudentCourseProgress, BlogPost, 
  PlatformStats, AuditLog, UserSession 
} from '../types';

interface StoreSchema {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  quizSubmissions: QuizSubmission[];
  enrollments: Enrollment[];
  studentProgress: StudentCourseProgress[];
  blogs: BlogPost[];
  auditLogs: AuditLog[];
  sessions: UserSession[];
  verificationCodes: Record<string, { code: string; expiresAt: string; user?: any; type: string }>;
}

const STORAGE_KEY = 'educore_local_store_v1';

function loadStore(): StoreSchema {
  if (typeof window === 'undefined') {
    return initialData as unknown as StoreSchema;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.courses && parsed.courses.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse local store, reinitializing', err);
  }
  saveStore(initialData as unknown as StoreSchema);
  return initialData as unknown as StoreSchema;
}

function saveStore(store: StoreSchema): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save local store', err);
  }
}

export const clientStore = {
  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    saveStore(initialData as unknown as StoreSchema);
  },

  getUsers(): User[] {
    return loadStore().users;
  },

  getUserById(id: string): User | undefined {
    return loadStore().users.find(u => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    return loadStore().users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  saveUser(user: User): void {
    const store = loadStore();
    const idx = store.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      store.users[idx] = user;
    } else {
      store.users.unshift(user);
    }
    saveStore(store);
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const store = loadStore();
    const idx = store.users.findIndex(u => u.id === id);
    if (idx < 0) return null;
    store.users[idx] = { ...store.users[idx], ...updates };
    saveStore(store);
    return store.users[idx];
  },

  getCourses(): Course[] {
    return loadStore().courses;
  },

  getCourseById(id: string): Course | undefined {
    return loadStore().courses.find(c => c.id === id);
  },

  saveCourse(course: Partial<Course>): Course {
    const store = loadStore();
    const id = course.id || `crs_${Date.now()}`;
    const newCourse: Course = {
      id,
      title: course.title || 'Untitled Course',
      slug: course.slug || id,
      description: course.description || '',
      thumbnailUrl: course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      category: course.category || 'General',
      level: course.level || 'Beginner',
      instructorId: course.instructorId || 'usr_inst_01',
      instructorName: course.instructorName || 'Dr. Rafiqul Islam',
      instructorAvatar: course.instructorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: course.lessonsCount || 0,
      totalDurationMinutes: course.totalDurationMinutes || 60,
      isPublished: course.isPublished !== undefined ? course.isPublished : true,
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: course.tags || ['Tech']
    };

    const idx = store.courses.findIndex(c => c.id === id);
    if (idx >= 0) {
      store.courses[idx] = { ...store.courses[idx], ...newCourse };
    } else {
      store.courses.unshift(newCourse);
    }
    saveStore(store);
    return newCourse;
  },

  deleteCourse(id: string): void {
    const store = loadStore();
    store.courses = store.courses.filter(c => c.id !== id);
    store.lessons = store.lessons.filter(l => l.courseId !== id);
    store.quizzes = store.quizzes.filter(q => q.courseId !== id);
    saveStore(store);
  },

  getLessons(courseId?: string): Lesson[] {
    const store = loadStore();
    if (courseId) {
      return store.lessons.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
    }
    return store.lessons;
  },

  saveLesson(lesson: Partial<Lesson>): Lesson {
    const store = loadStore();
    const id = lesson.id || `lsn_${Date.now()}`;
    const newLesson: Lesson = {
      id,
      courseId: lesson.courseId || '',
      title: lesson.title || 'Untitled Lesson',
      description: lesson.description || '',
      contentType: lesson.contentType || 'text',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      order: lesson.order || (store.lessons.filter(l => l.courseId === lesson.courseId).length + 1),
      durationMinutes: lesson.durationMinutes || 20,
      resources: lesson.resources || []
    };

    const idx = store.lessons.findIndex(l => l.id === id);
    if (idx >= 0) {
      store.lessons[idx] = { ...store.lessons[idx], ...newLesson };
    } else {
      store.lessons.push(newLesson);
    }
    
    // Update course lesson count
    const course = store.courses.find(c => c.id === newLesson.courseId);
    if (course) {
      course.lessonsCount = store.lessons.filter(l => l.courseId === newLesson.courseId).length;
    }

    saveStore(store);
    return newLesson;
  },

  deleteLesson(id: string): void {
    const store = loadStore();
    const target = store.lessons.find(l => l.id === id);
    store.lessons = store.lessons.filter(l => l.id !== id);
    if (target) {
      const course = store.courses.find(c => c.id === target.courseId);
      if (course) {
        course.lessonsCount = store.lessons.filter(l => l.courseId === target.courseId).length;
      }
    }
    saveStore(store);
  },

  getQuizByCourseId(courseId: string): Quiz | undefined {
    return loadStore().quizzes.find(q => q.courseId === courseId);
  },

  saveQuiz(quiz: Partial<Quiz>): Quiz {
    const store = loadStore();
    const id = quiz.id || `qiz_${Date.now()}`;
    const newQuiz: Quiz = {
      id,
      courseId: quiz.courseId || '',
      title: quiz.title || 'Course Assessment',
      description: quiz.description || '',
      passingScorePercentage: quiz.passingScorePercentage || 70,
      questions: quiz.questions || []
    };
    const idx = store.quizzes.findIndex(q => q.id === id || q.courseId === quiz.courseId);
    if (idx >= 0) {
      store.quizzes[idx] = { ...store.quizzes[idx], ...newQuiz };
    } else {
      store.quizzes.push(newQuiz);
    }
    saveStore(store);
    return newQuiz;
  },

  submitQuiz(quizId: string, userId: string, answers: Record<string, string>): { submission: QuizSubmission; evaluation: any } {
    const store = loadStore();
    const quiz = store.quizzes.find(q => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    const details = quiz.questions.map(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswerId;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedOptionId: selected,
        correctOptionId: q.correctAnswerId,
        isCorrect,
        explanation: q.explanation || ''
      };
    });

    const scorePercentage = Math.round((correctCount / (quiz.questions.length || 1)) * 100);
    const isPassed = scorePercentage >= quiz.passingScorePercentage;

    const submission: QuizSubmission = {
      id: `sub_${Date.now()}`,
      quizId,
      courseId: quiz.courseId,
      userId,
      answers,
      scorePercentage,
      isPassed,
      submittedAt: new Date().toISOString()
    };

    store.quizSubmissions.unshift(submission);
    saveStore(store);

    return {
      submission,
      evaluation: {
        scorePercentage,
        isPassed,
        passingScorePercentage: quiz.passingScorePercentage,
        correctCount,
        totalQuestions: quiz.questions.length,
        details
      }
    };
  },

  getEnrollments(userId: string): Enrollment[] {
    return loadStore().enrollments.filter(e => e.userId === userId);
  },

  enroll(userId: string, courseId: string): Enrollment {
    const store = loadStore();
    const existing = store.enrollments.find(e => e.userId === userId && e.courseId === courseId);
    if (existing) return existing;

    const enrollment: Enrollment = {
      id: `enr_${Date.now()}`,
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };
    store.enrollments.push(enrollment);

    // Also update user's enrolledCourseIds
    const user = store.users.find(u => u.id === userId);
    if (user) {
      user.enrolledCourseIds = Array.from(new Set([...(user.enrolledCourseIds || []), courseId]));
    }

    // Initialize progress record
    if (!store.studentProgress.some(p => p.userId === userId && p.courseId === courseId)) {
      store.studentProgress.push({
        id: `prog_${Date.now()}`,
        userId,
        courseId,
        completedLessonIds: [],
        progressPercentage: 0,
        lastAccessedAt: new Date().toISOString()
      });
    }

    saveStore(store);
    return enrollment;
  },

  getProgress(userId: string, courseId: string): StudentCourseProgress {
    const store = loadStore();
    let prog = store.studentProgress.find(p => p.userId === userId && p.courseId === courseId);
    if (!prog) {
      prog = {
        id: `prog_${Date.now()}`,
        userId,
        courseId,
        completedLessonIds: [],
        progressPercentage: 0,
        lastAccessedAt: new Date().toISOString()
      };
      store.studentProgress.push(prog);
      saveStore(store);
    }
    return prog;
  },

  toggleLessonComplete(userId: string, courseId: string, lessonId: string): StudentCourseProgress {
    const store = loadStore();
    let prog = store.studentProgress.find(p => p.userId === userId && p.courseId === courseId);
    if (!prog) {
      prog = {
        id: `prog_${Date.now()}`,
        userId,
        courseId,
        completedLessonIds: [lessonId],
        progressPercentage: 0,
        lastAccessedAt: new Date().toISOString()
      };
      store.studentProgress.push(prog);
    } else {
      const idx = prog.completedLessonIds.indexOf(lessonId);
      if (idx >= 0) {
        prog.completedLessonIds.splice(idx, 1);
      } else {
        prog.completedLessonIds.push(lessonId);
      }
      prog.lastAccessedAt = new Date().toISOString();
    }

    const totalLessons = store.lessons.filter(l => l.courseId === courseId).length || 1;
    prog.progressPercentage = Math.round((prog.completedLessonIds.length / totalLessons) * 100);

    saveStore(store);
    return prog;
  },

  getBlogs(): BlogPost[] {
    return loadStore().blogs;
  },

  saveBlog(blog: Partial<BlogPost>): BlogPost {
    const store = loadStore();
    const id = blog.id || `blg_${Date.now()}`;
    const newBlog: BlogPost = {
      id,
      title: blog.title || 'Untitled Post',
      slug: blog.slug || id,
      summary: blog.summary || '',
      content: blog.content || '',
      authorId: blog.authorId || 'usr_cm_01',
      authorName: blog.authorName || 'Farhana Rahman',
      authorAvatar: blog.authorAvatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      category: blog.category || 'Curriculum',
      readTimeMinutes: blog.readTimeMinutes || 5,
      isPublished: blog.isPublished !== undefined ? blog.isPublished : true,
      publishedAt: blog.publishedAt || new Date().toISOString(),
      tags: blog.tags || ['Education']
    };

    const idx = store.blogs.findIndex(b => b.id === id);
    if (idx >= 0) {
      store.blogs[idx] = { ...store.blogs[idx], ...newBlog };
    } else {
      store.blogs.unshift(newBlog);
    }
    saveStore(store);
    return newBlog;
  },

  deleteBlog(id: string): void {
    const store = loadStore();
    store.blogs = store.blogs.filter(b => b.id !== id);
    saveStore(store);
  },

  getStats(): PlatformStats {
    const store = loadStore();
    return {
      totalUsers: store.users.length,
      totalCourses: store.courses.length,
      totalLessons: store.lessons.length,
      totalEnrollments: store.enrollments.length,
      activeLearners: store.users.filter(u => u.role === 'student').length,
      completionRate: 78
    };
  },

  getAuditLogs(): AuditLog[] {
    return loadStore().auditLogs;
  }
};
