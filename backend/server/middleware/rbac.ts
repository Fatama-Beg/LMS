/**
 * 🇧🇩 আরব্যাক সিকিউরিটি মিডলওয়্যার (Role-Based Access Control Policy Middleware)
 * ডিজাইন প্যাটার্ন: পলিসি / স্ট্র্যাটেজি প্যাটার্ন (Policy / Strategy Pattern)
 * 
 * এই মিডলওয়্যারটি ফ্রন্টএন্ডের যেকোনো রিকোয়েস্টে প্রেরিত ইউজারের রোল যাচাই করে।
 * শুধুমাত্র UI হাইড না করে ব্যাকএন্ডে হার্ড পলিসি চেক করে ডেটা লিক সম্পূর্ণরূপে প্রতিরোধ করে।
 */

import { Request, Response, NextFunction } from 'express';
import { User, UserRole, UserSession } from '../../src/types';
import { DatabaseRepository } from '../repositories/database';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: UserSession;
}

const db = DatabaseRepository.getInstance();

/**
 * 🇧🇩 ইউজার অথেন্টিকেশন ও লোকালহোস্ট সেশন কন্ট্রোল এক্সট্রাক্টর
 * হেডার (Authorization: Bearer <token> অথবা x-user-id / x-session-id) থেকে ব্যবহারকারী ও সেশন যাচাই করে
 */
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = (req.headers['authorization']?.replace('Bearer ', '').trim()) || 
                (req.headers['x-session-token'] as string) || 
                (req.headers['x-user-id'] as string);
  
  if (token) {
    // 1. Check if token is an active session token (starts with sess_ or found in sessions store)
    const session = db.getSessionByToken(token);
    if (session) {
      const user = db.getUserById(session.userId);
      if (user) {
        req.user = user;
        req.session = session;
        // Touch session activity
        db.touchSession(session.id);
        return next();
      }
    }

    // 2. Fallback check for direct user ID (e.g. quick demo switcher usr_admin_01)
    const directUser = db.getUserById(token);
    if (directUser) {
      req.user = directUser;
      // Auto-create or attach session for direct demo user to guarantee session control
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1 (localhost)';
      const userAgent = req.headers['user-agent'] || 'Localhost Web Browser';
      const existingSessions = db.getUserSessions(directUser.id);
      const active = existingSessions.find(s => s.isValid);
      if (active) {
        req.session = active;
        db.touchSession(active.id);
      } else {
        req.session = db.createSession(directUser.id, { ipAddress: ip, userAgent });
      }
    }
  }
  next();
}

/**
 * 🇧🇩 লগইন বাধ্যতামূলক গার্ড
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication is required to access this resource.',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
}

/**
 * 🇧🇩 রোল-ভিত্তিক অ্যাক্সেস পলিসি এনফোর্সার (RBAC Enforcer)
 * @param allowedRoles অনুমোদিত রোলের তালিকা (যেমন: ['admin', 'content_manager'])
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please log in to perform this action.',
        code: 'UNAUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Your role (${req.user.role.toUpperCase()}) does not have permission for this action. Required: ${allowedRoles.join(', ')}`,
        code: 'PERMISSION_DENIED',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * 🇧🇩 কোর্স ওনারশিপ পলিসি মিডলওয়্যার (Course Ownership Policy)
 * - Admin ও Content Manager যেকোনো কোর্স সম্পাদনা করতে পারে।
 * - Instructor শুধুমাত্র নিজের তৈরি করা কোর্সে পরিবর্তন আনতে পারে।
 * - Student কোনো অবস্থাতেই কোর্স সম্পাদনা করতে পারে না।
 */
export function checkCourseOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { role, id: userId } = req.user;

  // Admin & Content Manager can access any course
  if (role === 'admin' || role === 'content_manager') {
    return next();
  }

  // Instructor check
  if (role === 'instructor') {
    const courseId = req.params.courseId || req.params.id || req.body.courseId;
    if (!courseId) {
      return next(); // Creating a new course
    }

    const course = db.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    if (course.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Instructors can only manage their own authored courses.',
        code: 'OWNERSHIP_VIOLATION'
      });
    }

    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden: Your role cannot manage course contents.',
    code: 'ROLE_FORBIDDEN'
  });
}

/**
 * 🇧🇩 লেসন ওনারশিপ পলিসি (Lesson Ownership Policy)
 */
export function checkLessonOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { role, id: userId } = req.user;

  if (role === 'admin' || role === 'content_manager') {
    return next();
  }

  if (role === 'instructor') {
    const lessonId = req.params.lessonId || req.params.id;
    const courseId = req.body.courseId;

    if (lessonId) {
      const lesson = db.getLessonById(lessonId);
      if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
      const course = db.getCourseById(lesson.courseId);
      if (course && course.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot modify lessons of a course you do not own.'
        });
      }
    } else if (courseId) {
      const course = db.getCourseById(courseId);
      if (course && course.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot add lessons to another instructor\'s course.'
        });
      }
    }
    return next();
  }

  return res.status(403).json({ success: false, error: 'Forbidden' });
}
