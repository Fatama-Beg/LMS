/**
 * 🇧🇩 প্ল্যাটফর্ম স্ট্যাটিস্টিক্স সার্ভিস (Platform Analytics & Metrics)
 * অ্যাডমিন ড্যাশবোর্ডের জন্য প্ল্যাটফর্মের মোট ইউজার, কোর্স, এনরোলমেন্ট ও কুইজ মেট্রিক্স হিসাব করে।
 */

import { PlatformStats } from '../../src/types';
import { DatabaseRepository } from '../repositories/database';

const db = DatabaseRepository.getInstance();

export class StatsService {
  public static getPlatformStats(): PlatformStats {
    const users = db.getUsers();
    const courses = db.getCourses();
    const lessons = db.getLessons();
    const enrollments = db.getEnrollments();
    const submissions = db.getSubmissions();
    const blogs = db.getBlogPosts(false);

    const usersByRole = {
      admin: users.filter(u => u.role === 'admin').length,
      content_manager: users.filter(u => u.role === 'content_manager').length,
      instructor: users.filter(u => u.role === 'instructor').length,
      student: users.filter(u => u.role === 'student').length,
    };

    const avgScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length)
      : 0;

    return {
      totalUsers: users.length,
      usersByRole,
      totalCourses: courses.length,
      totalLessons: lessons.length,
      totalEnrollments: enrollments.length,
      totalQuizzesTaken: submissions.length,
      totalBlogPosts: blogs.length,
      publishedBlogPosts: blogs.filter(b => b.status === 'published').length,
      averageQuizScore: avgScore
    };
  }
}
