/**
 * 🇧🇩 কোর্স ক্যাটালগ ভিউ (Course Catalog View)
 * 
 * সমস্ত কোর্সের তালিকা প্রদর্শন করে।
 * শুধুমাত্র Student রোল এনরোল করতে পারবে।
 * অন্যান্য রোল ক্লিক করলে ম্যাট্রিক্স অনুযায়ী ব্যাখ্যা প্রদর্শিত হবে।
 */

import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Clock, Award, CheckCircle, ArrowRight, Lock, Sparkles, Filter } from 'lucide-react';

interface CatalogViewProps {
  onSelectCourse: (courseId: string) => void;
  onNavigate: (view: string, data?: any) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectCourse, onNavigate }) => {
  const { currentUser, activeRole } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      if (res.success) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (activeRole !== 'student') {
      setFeedbackMessage('Course enrollment is available for Student accounts. Switch to a Student profile to enroll and track progress.');
      setTimeout(() => setFeedbackMessage(null), 4000);
      return;
    }

    try {
      setEnrollingId(courseId);
      const res = await api.enrollCourse(courseId);
      if (res.success) {
        setFeedbackMessage('Successfully enrolled! Redirecting to course...');
        setTimeout(() => {
          onSelectCourse(courseId);
        }, 800);
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Enrollment failed');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setEnrollingId(null);
    }
  };

  // 🇧🇩 ডায়নামিক ক্যাটাগরি ফিল্টারিং (Dynamic Category Extraction from active courses)
  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const enrolledCourseIds = currentUser?.enrolledCourseIds || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs text-indigo-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Engineering Courses
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Production-focused learning curricula designed for modern software engineers.
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses, skills, tech..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No courses match your query</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or browse all categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {course.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-xs">
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{course.lessonsCount || 4} Lessons</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.totalDurationMinutes || 90} mins</span>
                      </div>
                    </div>

                    {/* Instructor Info */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={course.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={course.instructorName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 block">{course.instructorName}</span>
                        <span className="text-[10px] text-slate-400">Course Lead</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {isEnrolled && activeRole === 'student' ? (
                        <button
                          onClick={() => onSelectCourse(course.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Enrolled • Continue Learning</span>
                        </button>
                      ) : activeRole === 'student' ? (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>{enrollingId === course.id ? 'Enrolling...' : 'Enroll in Course'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectCourse(course.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>View Course Content</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
