/**
 * 🇧🇩 প্রধান এক্সপ্রেস সার্ভার ও ব্যাকএন্ড আর্কিটেকচার (Express REST API Server)
 * 
 * ইন্টারভিউ ব্যাখ্যা (Interview Talking Points):
 * ১. আর্কিটেকচার ও ডিজাইন প্যাটার্নস (Architecture & Patterns):
 *    - RESTful Controller Architecture: প্রতিটি রিসোর্সের (Courses, Lessons, Quizzes, Blogs, Audit Logs) জন্য সুনির্দিষ্ট এন্ডপয়েন্ট।
 *    - Repository Pattern (`DatabaseRepository.getInstance()`): ডেটাবেস অ্যাক্সেসকে বিজনেস লজিক থেকে আলাদা রাখে।
 *    - Custom Middleware (`authenticateUser`, `requireAuth`, `requireRoles`): রিকোয়েস্ট অথেনটিকেশন ও RBAC পারমিশন ভ্যালিডেশন করে।
 * 
 * ২. অটো-গ্রেডিং ও বিজনেস সার্ভিসেস (Business Logic Services):
 *    - `AutoGradingService`: MCQ কুইজের উত্তরপত্র যাচাই করে স্বয়ংক্রিয়ভাবে স্কোর ও ফিডব্যাক নির্ধারণ করে।
 *    - `ProgressService`: সিকোয়েন্সিয়াল লেসন কমপ্লিশন ও কোর্স প্রগ্রেস শতকরা হিসেবে হিসাব করে।
 * 
 * ৩. ফুলস্ট্যাক ইন্টিগ্রেশন (Vite Middleware):
 *    - ডেভেলপমেন্ট মোডে সরাসরি Vite Middleware হিসেবে ক্লায়েন্ট এবং সার্ভার একই পোর্ট (3000)-এ পরিবেশন করে।
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DatabaseRepository } from './server/repositories/database';
import { authenticateUser, requireAuth, requireRoles, checkCourseOwnership, checkLessonOwnership, AuthenticatedRequest } from './server/middleware/rbac';
import { AutoGradingService } from './server/services/autoGradingService';
import { ProgressService } from './server/services/progressService';
import { BlogService } from './server/services/blogService';
import { StatsService } from './server/services/statsService';
import { User, UserRole, Course, Lesson, Quiz } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = DatabaseRepository.getInstance();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(authenticateUser);

  // ==========================================
  // 1. AUTHENTICATION & USER SESSIONS
  // ==========================================

  // 🇧🇩 বর্তমান ব্যবহারকারীর প্রোফাইল রিট্রিভ
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    res.json({ 
      success: true, 
      user: req.user,
      session: req.session || null
    });
  });

  // 🇧🇩 সক্রিয় সেশন স্ট্যাটাস ও লোকালহোস্ট কন্ট্রোল (Active Session Status)
  app.get('/api/auth/session', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No active session found', isExpired: true });
    }

    const host = req.headers.host || 'localhost:3000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    if (!req.session) {
      // Create session on the fly if needed
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1 (localhost)';
      const userAgent = (req.headers['user-agent'] as string) || 'Localhost Browser';
      req.session = db.createSession(req.user.id, { ipAddress: ip, userAgent });
    }

    const now = Date.now();
    const expiryTime = new Date(req.session.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));

    res.json({
      success: true,
      user: req.user,
      session: {
        ...req.session,
        isCurrent: true,
      },
      environment: {
        host,
        isLocalhost,
        nodeEnv: process.env.NODE_ENV || 'development',
        port: 3000
      },
      remainingSeconds,
      isExpired: remainingSeconds <= 0
    });
  });

  // 🇧🇩 সেশনের মেয়াদ বৃদ্ধি (Extend Session)
  app.post('/api/auth/session/extend', (req: AuthenticatedRequest, res) => {
    if (!req.user || !req.session) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { minutes = 30 } = req.body;
    const updated = db.extendSession(req.session.id, Number(minutes));

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Session not found or invalid' });
    }

    const now = Date.now();
    const expiryTime = new Date(updated.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));

    res.json({
      success: true,
      message: `Session extended by ${minutes} minutes`,
      session: updated,
      remainingSeconds
    });
  });

  // 🇧🇩 সেশন টাইমআউট ডিউরেশন কনফিগারেশন পরিবর্তন (Change Timeout Duration)
  app.post('/api/auth/session/timeout', (req: AuthenticatedRequest, res) => {
    if (!req.user || !req.session) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { timeoutMinutes } = req.body;
    if (!timeoutMinutes || typeof timeoutMinutes !== 'number' || timeoutMinutes <= 0) {
      return res.status(400).json({ success: false, error: 'Valid timeoutMinutes number is required' });
    }

    const updated = db.updateSessionTimeout(req.session.id, timeoutMinutes);

    res.json({
      success: true,
      message: `Session timeout duration set to ${timeoutMinutes} minutes`,
      session: updated
    });
  });

  // 🇧🇩 ব্যবহারকারীর সমস্ত সক্রিয় সেশনের তালিকা (List All User Sessions)
  app.get('/api/auth/sessions', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const sessions = db.getUserSessions(req.user.id, req.session?.id);
    res.json({
      success: true,
      sessions,
      currentSessionId: req.session?.id || null
    });
  });

  // 🇧🇩 একটি নির্দিষ্ট সেশন টার্মিনেট বা বাতিল করা (Revoke Specific Session)
  app.delete('/api/auth/sessions/:sessionId', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { sessionId } = req.params;
    const userSessions = db.getUserSessions(req.user.id);
    const targetSession = userSessions.find(s => s.id === sessionId);

    if (!targetSession) {
      return res.status(404).json({ success: false, error: 'Session not found for this user' });
    }

    db.revokeSession(sessionId);
    res.json({
      success: true,
      message: 'Session terminated successfully',
      terminatedSessionId: sessionId
    });
  });

  // 🇧🇩 অন্য সব সেশন বাতিল করা (Revoke All Other Sessions)
  app.delete('/api/auth/sessions', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const count = db.revokeAllUserSessions(req.user.id, req.session?.id);
    res.json({
      success: true,
      message: `Successfully terminated ${count} other active session(s)`,
      revokedCount: count
    });
  });

  // 🇧🇩 লগআউট ও সেশন টার্মিনেশন (Explicit Logout)
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    if (req.session) {
      db.revokeSession(req.session.id);
    }
    res.json({ success: true, message: 'Logged out and session terminated' });
  });

  // 🇧🇩 ১. ইমেইলে অথেনটিকেশন কোড (OTP / Security Code) পাঠানো
  app.post('/api/auth/send-code', (req, res) => {
    const { email, type = 'login', name, role = 'student', bio } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (type === 'login') {
      const existingUser = db.getUserByEmail(trimmedEmail);
      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          error: `No registered account found for ${trimmedEmail}. Please switch to the Register tab to create an account.` 
        });
      }
    } else if (type === 'register') {
      const existingUser = db.getUserByEmail(trimmedEmail);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: `An account with ${trimmedEmail} already exists. Please switch to Sign In.` 
        });
      }
    }

    // Generate random secure 6-digit numeric OTP code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to repository with 10-minute expiry
    const saved = db.saveVerificationCode(
      trimmedEmail, 
      generatedCode, 
      type as 'login' | 'register',
      type === 'register' ? { name: name || trimmedEmail.split('@')[0], role, bio } : undefined
    );

    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL SERVICE] Sent 6-Digit Authentication Code to: ${trimmedEmail}`);
    console.log(`🔐 CODE: ${generatedCode} (Expires: ${new Date(saved.expiresAt).toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    res.json({
      success: true,
      message: `Authentication code sent to ${trimmedEmail}`,
      email: trimmedEmail,
      codePreview: generatedCode, // Provided for easy development & instant testing
      expiresAt: saved.expiresAt
    });
  });

  // 🇧🇩 ২. অথেনটিকেশন কোড যাচাই ও লগইন/রেজিস্ট্রেশন সম্পন্ন করা (Verify 2FA Code & Issue Session)
  app.post('/api/auth/verify-code', (req, res) => {
    const { email, code, timeoutMinutes } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit authentication code are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const verificationRecord = db.getVerificationCode(trimmedEmail);
    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authentication code has expired or was not requested. Please request a new code.' 
      });
    }

    if (verificationRecord.code !== cleanCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid authentication code. Please check your registered email or the notification code.' 
      });
    }

    // Delete verified code (Single-Use Token guarantee)
    db.deleteVerificationCode(trimmedEmail);

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1 (localhost)';
    const userAgent = (req.headers['user-agent'] as string) || 'Localhost Browser';
    const sessionDuration = typeof timeoutMinutes === 'number' ? timeoutMinutes : 1440;

    if (verificationRecord.type === 'login') {
      const user = db.getUserByEmail(trimmedEmail);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found' });
      }

      const session = db.createSession(user.id, { 
        ipAddress: ip, 
        userAgent,
        timeoutMinutes: sessionDuration 
      });

      return res.json({
        success: true,
        message: 'Authentication successful',
        user,
        token: session.token,
        session
      });
    } else {
      // Register Flow
      const regData = verificationRecord.registrationData;
      const assignedRole: UserRole = ['student', 'instructor', 'content_manager', 'admin'].includes(regData?.role) 
        ? regData?.role 
        : 'student';

      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: regData?.name || trimmedEmail.split('@')[0],
        email: trimmedEmail,
        role: assignedRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(regData?.name || trimmedEmail)}`,
        bio: regData?.bio || `Learner passionate about software engineering.`,
        createdAt: new Date().toISOString(),
        enrolledCourseIds: []
      };

      db.createUser(newUser);

      const session = db.createSession(newUser.id, { 
        ipAddress: ip, 
        userAgent,
        timeoutMinutes: sessionDuration 
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Account registered and authenticated successfully',
        user: newUser, 
        token: session.token, 
        session 
      });
    }
  });

  // 🇧🇩 লগইন বা ডেমো ইউজার সিলেক্ট
  app.post('/api/auth/login', (req, res) => {
    const { email, timeoutMinutes } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found with this email' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1 (localhost)';
    const userAgent = (req.headers['user-agent'] as string) || 'Localhost Browser';
    const session = db.createSession(user.id, { 
      ipAddress: ip, 
      userAgent,
      timeoutMinutes: typeof timeoutMinutes === 'number' ? timeoutMinutes : 1440 
    });

    res.json({
      success: true,
      user,
      token: session.token,
      session
    });
  });

  // 🇧🇩 নতুন ব্যবহারকারী রেজিস্টার
  app.post('/api/auth/register', (req, res) => {
    const { name, email, role = 'student', bio, timeoutMinutes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Role safety check: public registration defaults to student or instructor
    const assignedRole: UserRole = ['student', 'instructor'].includes(role) ? role : 'student';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      email,
      role: assignedRole,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      bio: bio || `Learner passionate about software engineering.`,
      createdAt: new Date().toISOString(),
      enrolledCourseIds: []
    };

    db.createUser(newUser);

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1 (localhost)';
    const userAgent = (req.headers['user-agent'] as string) || 'Localhost Browser';
    const session = db.createSession(newUser.id, { 
      ipAddress: ip, 
      userAgent,
      timeoutMinutes: typeof timeoutMinutes === 'number' ? timeoutMinutes : 1440 
    });

    res.status(201).json({ 
      success: true, 
      user: newUser, 
      token: session.token,
      session 
    });
  });

  // 🇧🇩 ইউজার সেলফ-সার্ভিস প্রোফাইল আপডেট (All authenticated users)
  app.patch('/api/users/profile', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
      const updatedUser = db.updateUserProfile(req.user.id, req.body);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 2. ADMIN USER & ROLE MANAGEMENT
  // ==========================================

  // 🇧🇩 অ্যাডমিন: সকল ইউজার তালিকা (Admin Only)
  app.get('/api/users', requireRoles(['admin']), (req: AuthenticatedRequest, res) => {
    const users = db.getUsers();
    res.json({ success: true, users });
  });

  // 🇧🇩 অ্যাডমিন: ইউজারের রোল পরিবর্তন (Admin Only: promote / change / remove role)
  app.patch('/api/users/:id/role', requireRoles(['admin']), (req: AuthenticatedRequest, res) => {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['admin', 'content_manager', 'instructor', 'student'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified' });
    }

    try {
      const updatedUser = db.updateUserRole(userId, role as UserRole, req.user!);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 অ্যাডমিন: ইউজার ডিলিট (Admin Only)
  app.delete('/api/users/:id', requireRoles(['admin']), (req: AuthenticatedRequest, res) => {
    const userId = req.params.id;
    if (userId === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own admin account' });
    }

    const success = db.deleteUser(userId, req.user!);
    if (success) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  });

  // ==========================================
  // 3. COURSES & LESSON MANAGEMENT
  // ==========================================

  // 🇧🇩 সকল কোর্স তালিকা (Public / Authenticated)
  app.get('/api/courses', (req, res) => {
    const courses = db.getCourses();
    res.json({ success: true, courses });
  });

  // 🇧🇩 একক কোর্স ও তার লেসনসমূহ রিট্রিভ
  app.get('/api/courses/:id', (req, res) => {
    const course = db.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    const lessons = db.getLessons(course.id);
    const quiz = db.getQuizByCourseId(course.id);
    res.json({ success: true, course, lessons, quiz });
  });

  // 🇧🇩 নতুন কোর্স তৈরি (Admin, Content Manager, Instructor)
  app.post('/api/courses', requireRoles(['admin', 'content_manager', 'instructor']), (req: AuthenticatedRequest, res) => {
    const { title, description, category, level, thumbnailUrl, tags = [] } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const user = req.user!;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCourse: Course = {
      id: `crs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      slug: `${slug}-${Math.random().toString(36).substr(2, 4)}`,
      description,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      category: category || 'Software Engineering',
      level: level || 'Beginner',
      instructorId: user.id,
      instructorName: user.name,
      instructorAvatar: user.avatar,
      lessonsCount: 0,
      totalDurationMinutes: 0,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags
    };

    db.createCourse(newCourse);
    res.status(201).json({ success: true, course: newCourse });
  });

  // 🇧🇩 কোর্স এডিট (Admin, Content Manager, or Course Author Instructor)
  app.put('/api/courses/:id', requireRoles(['admin', 'content_manager', 'instructor']), checkCourseOwnership, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateCourse(req.params.id, req.body);
      res.json({ success: true, course: updated });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 অ্যাডমিন/কনটেন্ট ম্যানেজার: কোর্সে ইন্সট্রাক্টর অ্যাসাইন করা (Admin & Content Manager Only)
  app.patch('/api/courses/:id/assign-instructor', requireRoles(['admin', 'content_manager']), (req: AuthenticatedRequest, res) => {
    const { instructorId } = req.body;
    if (!instructorId) {
      return res.status(400).json({ success: false, error: 'Instructor ID is required' });
    }

    try {
      const course = db.assignInstructorToCourse(req.params.id, instructorId, req.user!);
      res.json({ success: true, course });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 কোর্স ডিলিট (Admin, Content Manager, or Course Author Instructor)
  app.delete('/api/courses/:id', requireRoles(['admin', 'content_manager', 'instructor']), checkCourseOwnership, (req: AuthenticatedRequest, res) => {
    const success = db.deleteCourse(req.params.id);
    if (success) {
      res.json({ success: true, message: 'Course deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Course not found' });
    }
  });

  // 🇧🇩 লেসন তৈরি (Admin, Content Manager, or Course Author Instructor)
  app.post('/api/lessons', requireRoles(['admin', 'content_manager', 'instructor']), checkLessonOwnership, (req: AuthenticatedRequest, res) => {
    const { courseId, title, description, contentType = 'video', videoUrl = '', content = '', durationMinutes = 15 } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ success: false, error: 'Course ID and title are required' });
    }

    const existingLessons = db.getLessons(courseId);
    const newLesson: Lesson = {
      id: `lsn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      courseId,
      title,
      description,
      contentType,
      videoUrl,
      content,
      order: existingLessons.length + 1,
      durationMinutes: Number(durationMinutes) || 15
    };

    db.createLesson(newLesson);
    res.status(201).json({ success: true, lesson: newLesson });
  });

  // 🇧🇩 লেসন এডিট
  app.put('/api/lessons/:id', requireRoles(['admin', 'content_manager', 'instructor']), checkLessonOwnership, (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateLesson(req.params.id, req.body);
      res.json({ success: true, lesson: updated });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 লেসন ডিলিট
  app.delete('/api/lessons/:id', requireRoles(['admin', 'content_manager', 'instructor']), checkLessonOwnership, (req: AuthenticatedRequest, res) => {
    const success = db.deleteLesson(req.params.id);
    if (success) {
      res.json({ success: true, message: 'Lesson deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Lesson not found' });
    }
  });

  // ==========================================
  // 4. STUDENT ENROLLMENT (Student Only)
  // ==========================================

  // 🇧🇩 কোর্সে এনরোল করা (শুধুমাত্র Student রোলের জন্য প্রযোজ্য)
  app.post('/api/enrollments', requireRoles(['student']), (req: AuthenticatedRequest, res) => {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'Course ID is required' });
    }

    const course = db.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const enrollment = db.createEnrollment(req.user!.id, courseId);
    res.status(201).json({ success: true, enrollment });
  });

  // 🇧🇩 শিক্ষার্থীর এনরোলকৃত কোর্সসমূহ পাওয়া (My Courses)
  app.get('/api/enrollments/my', requireRoles(['student']), (req: AuthenticatedRequest, res) => {
    const enrollments = db.getEnrollments(req.user!.id);
    const enrolledCourses = enrollments.map(enr => {
      const course = db.getCourseById(enr.courseId);
      const progress = db.getProgress(req.user!.id, enr.courseId);
      return {
        ...course,
        enrollment: enr,
        progress
      };
    }).filter(Boolean);

    res.json({ success: true, courses: enrolledCourses });
  });

  // ==========================================
  // 5. PROGRESS TRACKING (Student & Instructors)
  // ==========================================

  // 🇧🇩 শিক্ষার্থীর নির্দিষ্ট কোর্সের প্রোগ্রেস পাওয়া
  app.get('/api/progress/:courseId', requireAuth, (req: AuthenticatedRequest, res) => {
    const { courseId } = req.params;
    const studentId = req.user!.id;
    const progress = ProgressService.getStudentProgress(studentId, courseId);
    res.json({ success: true, progress });
  });

  // 🇧🇩 লেসন সম্পূর্ণ (Mark Complete / Incomplete) টগল করা (Student Only)
  app.post('/api/progress/toggle-lesson', requireRoles(['student']), (req: AuthenticatedRequest, res) => {
    const { courseId, lessonId } = req.body;
    if (!courseId || !lessonId) {
      return res.status(400).json({ success: false, error: 'courseId and lessonId are required' });
    }

    const updatedProgress = ProgressService.toggleLessonCompletion(req.user!.id, courseId, lessonId);
    res.json({ success: true, progress: updatedProgress });
  });

  // 🇧🇩 শিক্ষক ও অ্যাডমিনের জন্য কোর্সের সমস্ত শিক্ষার্থীর প্রোগ্রেস রিপোর্ট
  app.get('/api/courses/:id/progress-report', requireRoles(['admin', 'content_manager', 'instructor']), checkCourseOwnership, (req, res) => {
    const report = ProgressService.getCourseProgressReport(req.params.id);
    res.json({ success: true, report });
  });

  // ==========================================
  // 6. QUIZ CREATION & AUTO-GRADING
  // ==========================================

  // 🇧🇩 কুইজ তৈরি ও আপডেট (Admin, Content Manager, or Course Author Instructor)
  app.post('/api/quizzes', requireRoles(['admin', 'content_manager', 'instructor']), checkCourseOwnership, (req: AuthenticatedRequest, res) => {
    const { courseId, title, description, questions, passingPercentage = 70, timeLimitMinutes = 15 } = req.body;
    if (!courseId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Course ID, title, and at least one MCQ question are required' });
    }

    const quiz: Quiz = {
      id: req.body.id || `qiz_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      courseId,
      title,
      description,
      questions,
      passingPercentage: Number(passingPercentage) || 70,
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      createdAt: new Date().toISOString(),
      createdBy: req.user!.id
    };

    db.saveQuiz(quiz);
    res.status(201).json({ success: true, quiz });
  });

  // 🇧🇩 কুইজ জমা দেওয়া ও তাৎক্ষণিক অটো-গ্রেডিং (Student Only)
  app.post('/api/quizzes/:id/submit', requireRoles(['student']), (req: AuthenticatedRequest, res) => {
    const { answers } = req.body;
    const quizId = req.params.id;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Answers object is required' });
    }

    try {
      const result = AutoGradingService.submitAndGrade(
        quizId,
        req.user!.id,
        req.user!.name,
        answers
      );
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 কুইজ সাবমিশন ইতিহাস দেখা
  app.get('/api/quizzes/submissions', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role === 'student') {
      // ছাত্র শুধু নিজের সাবমিশন দেখবে
      const submissions = db.getSubmissions(user.id);
      return res.json({ success: true, submissions });
    } else {
      // অ্যাডমিন, কন্টেন্ট ম্যানেজার ও ইন্সট্রাক্টর
      const submissions = db.getSubmissions();
      return res.json({ success: true, submissions });
    }
  });

  // ==========================================
  // 7. BLOG CMS (Draft / Published State Machine)
  // ==========================================

  // 🇧🇩 ব্লগ পোস্টের তালিকা
  app.get('/api/blogs', (req: AuthenticatedRequest, res) => {
    const blogs = BlogService.getBlogsForUser(req.user);
    res.json({ success: true, blogs });
  });

  // 🇧🇩 একক ব্লগ বিস্তারিত
  app.get('/api/blogs/:id', (req: AuthenticatedRequest, res) => {
    const blog = db.getBlogPostById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    // ড্রাফট চেক: প্রিভিলেজড ছাড়া অন্য কেউ ড্রাফট পড়তে পারবে না
    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'content_manager');
    if (blog.status === 'draft' && !isPrivileged) {
      return res.status(403).json({ success: false, error: 'Access forbidden: Post is in draft mode.' });
    }

    res.json({ success: true, blog });
  });

  // 🇧🇩 নতুন ব্লগ তৈরি (Admin & Content Manager Only)
  app.post('/api/blogs', requireRoles(['admin', 'content_manager']), (req: AuthenticatedRequest, res) => {
    const { title, content, excerpt, coverImageUrl, tags, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const post = BlogService.createBlog(req.user!, {
      title,
      content,
      excerpt,
      coverImageUrl,
      tags,
      status
    });

    res.status(201).json({ success: true, blog: post });
  });

  // 🇧🇩 ব্লগ এডিট (Admin & Content Manager Only)
  app.put('/api/blogs/:id', requireRoles(['admin', 'content_manager']), (req: AuthenticatedRequest, res) => {
    try {
      const updated = db.updateBlogPost(req.params.id, req.body);
      res.json({ success: true, blog: updated });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 ব্লগ পাবলিশ / ড্রাফট স্ট্যাটাস পরিবর্তন
  app.patch('/api/blogs/:id/status', requireRoles(['admin', 'content_manager']), (req: AuthenticatedRequest, res) => {
    try {
      const updated = BlogService.togglePublishStatus(req.params.id, req.user!);
      res.json({ success: true, blog: updated });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 🇧🇩 ব্লগ ডিলিট (Admin & Content Manager Only)
  app.delete('/api/blogs/:id', requireRoles(['admin', 'content_manager']), (req, res) => {
    const success = db.deleteBlogPost(req.params.id);
    if (success) {
      res.json({ success: true, message: 'Blog post deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Blog not found' });
    }
  });

  // ==========================================
  // 8. STATS & AUDIT LOGS (Admin Only)
  // ==========================================

  app.get('/api/stats', requireRoles(['admin']), (req, res) => {
    const stats = StatsService.getPlatformStats();
    res.json({ success: true, stats });
  });

  app.get('/api/audit-logs', requireRoles(['admin']), (req, res) => {
    const logs = db.getAuditLogs();
    res.json({ success: true, logs });
  });

  // 🇧🇩 সিড ডেটা রিস্টোর (Reset demo data for evaluator testing)
  app.post('/api/reset-demo', (req, res) => {
    const resetData = db.resetToSeed();
    res.json({ success: true, message: 'LMS Demo Database reset to initial state successfully.', data: resetData });
  });

  // ==========================================
  // 9. VITE MIDDLEWARE & SPA SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LMS Server running with 4-tier RBAC on http://localhost:${PORT}`);
  });
}

startServer();
