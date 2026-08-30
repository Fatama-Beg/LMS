/**
 * 🇧🇩 লেসন ভিউয়ার ও সিকুয়েন্সিয়াল লার্নিং (Sequential Lesson Viewer with Progress Engine)
 * 
 * রিকোয়ারমেন্ট:
 * - Student can view the lessons of enrolled courses in sequence (Next / Previous).
 * - Lessons support video URLs (embed) or markdown/rich text.
 * - "Mark Complete" toggle updates progress percentage dynamically (e.g. 3 of 5 = 60%).
 * - Progress persists across page refreshes.
 * - Direct launcher for Course MCQ Quiz.
 */

import React, { useState, useEffect } from 'react';
import { Course, Lesson, Quiz, StudentCourseProgress } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Play,
  FileText,
  ChevronRight,
  ChevronLeft,
  Award,
  Video,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LessonViewProps {
  courseId: string;
  onBack: () => void;
  onTakeQuiz: (quizId: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ courseId, onBack, onTakeQuiz }) => {
  const { currentUser, activeRole } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [progress, setProgress] = useState<StudentCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.getCourseDetails(courseId);
      if (res.success) {
        setCourse(res.course);
        setLessons(res.lessons || []);
        setQuiz(res.quiz || null);
      }

      // Fetch progress if student or user logged in
      if (currentUser) {
        const progRes = await api.getProgress(courseId);
        if (progRes.success) {
          setProgress(progRes.progress);
        }
      }
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId, currentUser]);

  const activeLesson = lessons[activeLessonIndex] || lessons[0];

  const handleToggleComplete = async (lessonId: string) => {
    if (!currentUser || activeRole !== 'student') {
      alert('Only students can mark lessons as complete per the permission matrix.');
      return;
    }

    try {
      setIsUpdatingProgress(true);
      const res = await api.toggleLessonComplete(courseId, lessonId);
      if (res.success) {
        setProgress(res.progress);
        if (res.progress.isCompleted) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">Course not found.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const completedIds = progress?.completedLessonIds || [];
  const completedCount = completedIds.length;
  const totalCount = lessons.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCurrentLessonCompleted = activeLesson ? completedIds.includes(activeLesson.id) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              {course.category} • Sequential Curriculum
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate max-w-xl">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Progress Gauge */}
        <div className="flex items-center gap-4 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Progress</span>
            <span className="text-xs font-bold text-slate-900">
              {completedCount} / {totalCount} ({percentage}%)
            </span>
          </div>
          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Lesson Stage (Video Player / Content / Navigation) */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeLesson ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              
              {/* Media Stage: Video Player or Header */}
              {activeLesson.contentType === 'video' && activeLesson.videoUrl ? (
                <div className="space-y-0">
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
                    {activeLesson.videoUrl.startsWith('blob:') || 
                     activeLesson.videoUrl.startsWith('data:video') || 
                     activeLesson.videoUrl.match(/\.(mp4|webm|mov|mkv|ogg)(\?.*)?$/i) ? (
                      <video
                        src={activeLesson.videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <iframe
                        src={activeLesson.videoUrl}
                        title={activeLesson.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>

                  {/* Video Metadata Bar */}
                  <div className="bg-slate-900 text-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs border-t border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-slate-100">Class Video Lecture</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">
                        Uploaded by: <strong className="text-indigo-400">{course.instructorName || 'Assigned Instructor'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Duration: {activeLesson.durationMinutes} mins</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Enrolled Student Access</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                        Text & Markdown Module
                      </span>
                      <h2 className="text-base font-bold">{activeLesson.title}</h2>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    Est. {activeLesson.durationMinutes} mins
                  </span>
                </div>
              )}

              {/* Lesson Body Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.description && (
                      <p className="text-xs text-slate-600 mt-1">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>

                  {/* Mark Complete Toggle Button */}
                  {activeRole === 'student' && (
                    <button
                      onClick={() => handleToggleComplete(activeLesson.id)}
                      disabled={isUpdatingProgress}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        isCurrentLessonCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCurrentLessonCompleted ? 'Completed ✓ (Click to Undo)' : 'Mark Lesson Complete'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Rich Content View */}
                <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                  {activeLesson.content}
                </div>

                {/* Sequential Controls (Previous / Next) */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setActiveLessonIndex(Math.max(0, activeLessonIndex - 1))}
                    disabled={activeLessonIndex === 0}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Lesson
                  </button>

                  {activeLessonIndex < lessons.length - 1 ? (
                    <button
                      onClick={() => setActiveLessonIndex(activeLessonIndex + 1)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      Next Lesson
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : quiz ? (
                    <button
                      onClick={() => onTakeQuiz(quiz.id)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 animate-bounce cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      Take Final Course Quiz
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">All Lessons Finished!</span>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">No lessons added to this course yet.</p>
            </div>
          )}

        </div>

        {/* Right Column: Curriculum Outline Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Course Syllabus</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{lessons.length} Modules</span>
            </div>

            {/* Lesson Item List */}
            <div className="space-y-2">
              {lessons.map((lesson, idx) => {
                const isActive = idx === activeLessonIndex;
                const isDone = completedIds.includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonIndex(idx)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-200 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : isActive ? (
                        <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {lesson.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="capitalize">{lesson.contentType}</span>
                        <span>•</span>
                        <span>{lesson.durationMinutes} min</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quiz Box */}
            {quiz && (
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> MCQ Assessment
                    </span>
                    <span className="text-[10px] font-semibold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                      Pass: {quiz.passingPercentage}%
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{quiz.title}</p>
                  <p className="text-[11px] text-slate-600">{quiz.questions.length} Questions with Instant Auto-Grading</p>
                  <button
                    onClick={() => onTakeQuiz(quiz.id)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Start Quiz</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
