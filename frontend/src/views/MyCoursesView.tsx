/**
 * 🇧🇩 মাই কোর্সেস ভিউ (Student's "My Courses" View & Progress Dashboard)
 * 
 * রিকোয়ারমেন্ট:
 * - Enrolled courses show up separately under "My Courses"
 * - For each course, show the student's progress percentage (e.g. 3 of 5 lessons done = 60%)
 * - This progress must be accurate per student, per course and persist across refreshes.
 */

import React, { useState, useEffect } from 'react';
import { Course, StudentCourseProgress } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Library, BookOpen, Clock, CheckCircle2, PlayCircle, Award, ArrowRight } from 'lucide-react';

interface MyCoursesViewProps {
  onSelectCourse: (courseId: string) => void;
  onNavigate: (view: string) => void;
}

export const MyCoursesView: React.FC<MyCoursesViewProps> = ({ onSelectCourse, onNavigate }) => {
  const { currentUser, activeRole } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<(Course & { progress: StudentCourseProgress })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getMyCourses();
      if (res.success) {
        setEnrolledCourses(res.courses as any);
      }
    } catch (err) {
      console.error('Failed to load my courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, [currentUser]);

  if (activeRole !== 'student') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Library className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Student Dashboard Area</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You are currently signed in with the role <span className="font-bold text-indigo-600 uppercase">[{activeRole}]</span>. "My Courses" is specifically designed for students to track their enrolled courses and sequential lesson progress.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs hover:bg-indigo-700 transition-colors"
        >
          Browse All Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-indigo-600" />
            <span>My Enrolled Courses</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your ongoing curricula, lesson completion milestones, and quiz results.
          </p>
        </div>

        <button
          onClick={() => onNavigate('catalog')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors self-start md:self-auto cursor-pointer"
        >
          + Enroll in More Courses
        </button>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(n => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : enrolledCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">You haven't enrolled in any courses yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose from our modern Next.js, Strapi, and software engineering courses to begin learning.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Explore Course Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map(course => {
            const progress = course.progress || {
              completedLessonsCount: 0,
              totalLessons: course.lessonsCount || 4,
              progressPercentage: 0,
              isCompleted: false
            };

            const percentage = progress.progressPercentage || 0;
            const completedCount = progress.completedLessonsCount || 0;
            const totalCount = progress.totalLessons || course.lessonsCount || 4;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-6"
              >
                <div className="flex gap-4">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {course.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 leading-snug truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      By {course.instructorName}
                    </p>
                  </div>
                </div>

                {/* Progress Bar with Exact Formula (e.g. 3 of 5 lessons done = 60%) */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-indigo-600" />
                      <span>Curriculum Progress</span>
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {completedCount} of {totalCount} lessons done ({percentage}%)
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        percentage === 100
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      {percentage === 100 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All Lessons Completed!
                        </span>
                      ) : (
                        <span>{totalCount - completedCount} lessons remaining</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">Persisted in DB</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{percentage > 0 ? 'Resume Learning' : 'Start Course'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
