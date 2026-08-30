/**
 * 🇧🇩 প্রোগ্রেস ট্র্যাকিং সার্ভিস (Progress Tracking & Calculation Service)
 * 
 * রিকোয়ারমেন্ট অনুযায়ী:
 * ১. ছাত্র যখন কোনো লেসন সম্পন্ন করে, তখন "Mark Complete" চাপলে প্রোগ্রেস ডাটাবেসে সেভ হবে।
 * ২. প্রতিটি কোর্সে ছাত্রের সম্পন্ন হওয়া শতকরা হার হিসাব হবে (যেমন: ৫ টির মধ্যে ৩ টি শেষ = ৬০%)।
 * ৩. প্রতি ছাত্র এবং প্রতি কোর্সের জন্য প্রোগ্রেস নির্ভুলভাবে পারসিস্ট করবে (পেজ রিফ্রেশ করলেও অক্ষত থাকবে)।
 */

import { StudentCourseProgress } from '../../src/types';
import { DatabaseRepository } from '../repositories/database';

const db = DatabaseRepository.getInstance();

export class ProgressService {
  /**
   * 🇧🇩 লেসন কমপ্লিশন টগল এবং প্রোগ্রেস পার্সেন্টেজ হিসাব
   */
  public static toggleLessonCompletion(studentId: string, courseId: string, lessonId: string): StudentCourseProgress {
    let progress = db.getProgress(studentId, courseId);
    const courseLessons = db.getLessons(courseId);
    const totalLessons = courseLessons.length;

    if (!progress) {
      progress = {
        id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId,
        courseId,
        completedLessonIds: [],
        totalLessons,
        completedLessonsCount: 0,
        progressPercentage: 0,
        isCompleted: false,
        lastActiveLessonId: lessonId,
        updatedAt: new Date().toISOString()
      };
    }

    const isAlreadyCompleted = progress.completedLessonIds.includes(lessonId);

    if (isAlreadyCompleted) {
      // আন-মার্ক করা
      progress.completedLessonIds = progress.completedLessonIds.filter(id => id !== lessonId);
    } else {
      // সম্পন্ন হিসেবে মার্ক করা
      progress.completedLessonIds.push(lessonId);
    }

    // নির্ভুল প্রোগ্রেস গণনা সূত্র: (Completed Lessons / Total Lessons) * 100
    progress.totalLessons = totalLessons;
    progress.completedLessonsCount = progress.completedLessonIds.length;
    progress.progressPercentage = totalLessons > 0
      ? Math.round((progress.completedLessonsCount / totalLessons) * 100 * 10) / 10
      : 0;
    
    progress.isCompleted = totalLessons > 0 && progress.completedLessonsCount === totalLessons;
    progress.lastActiveLessonId = lessonId;
    progress.updatedAt = new Date().toISOString();

    db.saveProgress(progress);
    return progress;
  }

  /**
   * 🇧🇩 নির্দিষ্ট কোর্স ও ছাত্রের বর্তমান প্রোগ্রেস পাওয়া
   */
  public static getStudentProgress(studentId: string, courseId: string): StudentCourseProgress {
    let progress = db.getProgress(studentId, courseId);
    const courseLessons = db.getLessons(courseId);
    const totalLessons = courseLessons.length;

    if (!progress) {
      progress = {
        id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId,
        courseId,
        completedLessonIds: [],
        totalLessons,
        completedLessonsCount: 0,
        progressPercentage: 0,
        isCompleted: false,
        lastActiveLessonId: courseLessons[0]?.id,
        updatedAt: new Date().toISOString()
      };
      db.saveProgress(progress);
    } else if (progress.totalLessons !== totalLessons) {
      // লেসন সংখ্যা আপডেট হলে প্রোগ্রেস পুনরায় পরিমাপ করা
      progress.totalLessons = totalLessons;
      progress.completedLessonsCount = progress.completedLessonIds.length;
      progress.progressPercentage = totalLessons > 0
        ? Math.round((progress.completedLessonsCount / totalLessons) * 100 * 10) / 10
        : 0;
      progress.isCompleted = totalLessons > 0 && progress.completedLessonsCount === totalLessons;
      db.saveProgress(progress);
    }

    return progress;
  }

  /**
   * 🇧🇩 ইন্সট্রাক্টর বা অ্যাডমিনের জন্য কোর্সের সমস্ত শিক্ষার্থীর প্রোগ্রেস বিবরণী
   */
  public static getCourseProgressReport(courseId: string) {
    const enrollments = db.getEnrollments().filter(e => e.courseId === courseId);
    const course = db.getCourseById(courseId);
    const courseLessons = db.getLessons(courseId);

    return enrollments.map(enr => {
      const student = db.getUserById(enr.studentId);
      const prog = db.getProgress(enr.studentId, courseId);
      const submissions = db.getSubmissions(enr.studentId).filter(s => s.courseId === courseId);
      const latestQuiz = submissions[submissions.length - 1];

      return {
        enrollmentId: enr.id,
        studentId: enr.studentId,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || 'N/A',
        studentAvatar: student?.avatar,
        enrolledAt: enr.enrolledAt,
        completedLessonsCount: prog ? prog.completedLessonsCount : 0,
        totalLessons: courseLessons.length,
        progressPercentage: prog ? prog.progressPercentage : 0,
        isCompleted: prog ? prog.isCompleted : false,
        quizScore: latestQuiz ? `${latestQuiz.percentage}% (${latestQuiz.score}/${latestQuiz.totalPoints})` : 'Not Taken',
        quizStatus: latestQuiz ? (latestQuiz.isPassed ? 'Passed' : 'Failed') : 'Pending'
      };
    });
  }
}
