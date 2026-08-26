/**
 * 🇧🇩 কোর্স স্টুডিও ভিউ (Course Studio & Content Authoring View)
 * 
 * অ্যাক্সেস পারমিশন:
 * - Admin: যেকোনো কোর্স, লেসন ও কুইজ তৈরি, এডিট ও ডিলিট করতে পারবে।
 * - Content Manager: প্ল্যাটফর্মের যেকোনো কোর্স, লেসন ও কুইজ তৈরি, এডিট ও ডিলিট করতে পারবে।
 * - Instructor: শুধুমাত্র নিজের তৈরি কোর্সের (Own courses only) লেসন, কুইজ ও প্রোগ্রেস ম্যানেজ করতে পারবে।
 * - Student: স্টুডিওতে প্রবেশাধিকার নেই (Forbidden)।
 */

import React, { useState, useEffect, useRef } from 'react';
import { Course, Lesson, Quiz, QuizQuestion, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  FileText,
  Award,
  Users,
  ShieldCheck,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Upload,
  Film,
  PlayCircle,
  FileVideo,
  Clock,
  UserCheck
} from 'lucide-react';

export const CourseStudioView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseQuiz, setCourseQuiz] = useState<Quiz | null>(null);
  const [progressReport, setProgressReport] = useState<any[]>([]);

  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

  // Video Upload Mode inside Lesson Modal
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'embed'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for Course
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Software Engineering',
    level: 'Intermediate' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
    tags: 'Next.js, TypeScript',
    instructorId: ''
  });

  // Form states for Lesson
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    contentType: 'video' as 'video' | 'text',
    videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
    content: '## Class Video Notes\nKey architectural takeaways and reference code from this lecture.',
    durationMinutes: 25
  });

  // Form states for Quiz
  const [quizForm, setQuizForm] = useState({
    title: 'Knowledge Evaluation Quiz',
    description: 'Verify your mastery of this course module.',
    passingPercentage: 70,
    timeLimitMinutes: 15,
    questions: [
      {
        id: 'q_new_1',
        question: 'What is the key benefit of React Server Components?',
        points: 10,
        options: [
          { id: 'opt_1', text: 'Zero client-side JS bundle overhead' },
          { id: 'opt_2', text: 'Runs exclusively in browser memory' },
          { id: 'opt_3', text: 'Requires jQuery' }
        ],
        correctOptionId: 'opt_1',
        explanation: 'RSC executes on the server, streaming clean HTML without bulky JS.'
      }
    ]
  });

  const fetchStudioCourses = async () => {
    try {
      setLoading(true);
      const [res, usersRes] = await Promise.all([
        api.getCourses(),
        api.getUsers().catch(() => ({ success: false, users: [] }))
      ]);

      if (usersRes.success) {
        setUsers(usersRes.users);
      }

      if (res.success) {
        // Filter per role: Instructor sees own, Admin/CM sees all
        if (activeRole === 'instructor' && currentUser) {
          const myCourses = res.courses.filter(c => c.instructorId === currentUser.id);
          setCourses(myCourses);
          if (myCourses.length > 0 && !selectedCourse) {
            handleSelectCourse(myCourses[0]);
          }
        } else {
          setCourses(res.courses);
          if (res.courses.length > 0 && !selectedCourse) {
            handleSelectCourse(res.courses[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load studio courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioCourses();
  }, [currentUser, activeRole]);

  const handleSelectCourse = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const details = await api.getCourseDetails(course.id);
      if (details.success) {
        setCourseLessons(details.lessons || []);
        setCourseQuiz(details.quiz || null);
      }

      // Fetch enrolled student progress report
      const reportRes = await api.getCourseProgressReport(course.id);
      if (reportRes.success) {
        setProgressReport(reportRes.report || []);
      }
    } catch (err) {
      console.error('Error fetching course sub-resources', err);
    }
  };

  const processVideoFile = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|ogg)$/i)) {
      alert('Please upload a valid video file (.mp4, .webm, .mov, etc.)');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFileName(file.name);
    setUploadedFileSize(`${sizeMb} MB`);

    const objectUrl = URL.createObjectURL(file);
    setLessonForm(prev => ({
      ...prev,
      contentType: 'video',
      videoUrl: objectUrl,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }));
  };

  const handleVideoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  // Open Lesson Modal with preset mode
  const handleOpenLessonModal = (mode: 'video' | 'text' = 'video') => {
    setEditingLesson(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setVideoSourceType('upload');
    setLessonForm({
      title: mode === 'video' ? 'Class Lecture: ' : 'Reading Module: ',
      description: '',
      contentType: mode,
      videoUrl: mode === 'video' ? 'https://www.youtube.com/embed/ZjAqacIC_3c' : '',
      content: mode === 'video' 
        ? '## Class Video Notes & Key Concepts\n- Core architectural overview discussed in this class.\n- Code patterns demonstrated.\n- Recommended assignments and reference documentation.'
        : '## Module Reading & Reference Guide\nDetailed comprehensive text notes.',
      durationMinutes: mode === 'video' ? 30 : 15
    });
    setIsLessonModalOpen(true);
  };

  // ======================
  // COURSE HANDLERS
  // ======================
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse?.id) {
        await api.updateCourse(editingCourse.id, {
          ...courseForm,
          tags: courseForm.tags.split(',').map(t => t.trim())
        });
      } else {
        await api.createCourse({
          ...courseForm,
          tags: courseForm.tags.split(',').map(t => t.trim())
        });
      }
      setIsCourseModalOpen(false);
      setEditingCourse(null);
      fetchStudioCourses();
    } catch (err: any) {
      alert(err.message || 'Course action failed');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course and all associated lessons and quizzes?')) {
      try {
        await api.deleteCourse(courseId);
        setSelectedCourse(null);
        fetchStudioCourses();
      } catch (err: any) {
        alert(err.message || 'Failed to delete course');
      }
    }
  };

  // ======================
  // LESSON HANDLERS
  // ======================
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      if (editingLesson?.id) {
        await api.updateLesson(editingLesson.id, {
          ...lessonForm,
          courseId: selectedCourse.id
        });
      } else {
        await api.createLesson({
          ...lessonForm,
          courseId: selectedCourse.id
        });
      }
      setIsLessonModalOpen(false);
      setEditingLesson(null);
      handleSelectCourse(selectedCourse);
    } catch (err: any) {
      alert(err.message || 'Lesson action failed');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('Delete this lesson?')) {
      try {
        await api.deleteLesson(lessonId);
        if (selectedCourse) handleSelectCourse(selectedCourse);
      } catch (err: any) {
        alert(err.message || 'Failed to delete lesson');
      }
    }
  };

  // ======================
  // QUIZ HANDLERS
  // ======================
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      await api.saveQuiz({
        courseId: selectedCourse.id,
        title: quizForm.title,
        description: quizForm.description,
        passingPercentage: quizForm.passingPercentage,
        timeLimitMinutes: quizForm.timeLimitMinutes,
        questions: quizForm.questions
      });
      setIsQuizModalOpen(false);
      handleSelectCourse(selectedCourse);
    } catch (err: any) {
      alert(err.message || 'Quiz save failed');
    }
  };

  if (activeRole === 'student') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          The Course Studio authoring workspace is available for <strong>Instructors</strong>, <strong>Content Managers</strong>, and <strong>Administrators</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
              {activeRole.replace('_', ' ')} Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Course & Curriculum Studio
          </h1>
          <p className="text-xs text-slate-600">
            {activeRole === 'instructor'
              ? 'Author and manage your own courses, sequential lessons, MCQ quizzes, and view student progress.'
              : 'Create, curate, and govern curriculum across the entire LMS platform.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCourse(null);
            setCourseForm({
              title: '',
              description: '',
              category: 'Frontend Engineering',
              level: 'Intermediate',
              thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
              tags: 'Next.js, TypeScript'
            });
            setIsCourseModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left List of Courses */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Managed Courses</span>
              <span className="text-xs font-semibold text-slate-500">{courses.length}</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCourse(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase block">{c.category}</span>
                      <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">{c.title}</h4>
                      <span className="text-[10px] text-slate-500">Instructor: {c.instructorName}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourse(c);
                          setCourseForm({
                            title: c.title,
                            description: c.description,
                            category: c.category,
                            level: c.level,
                            thumbnailUrl: c.thumbnailUrl,
                            tags: c.tags?.join(', ') || ''
                          });
                          setIsCourseModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white"
                        title="Edit Course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(c.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Details: Lessons, Quiz, Progress Report */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <>
              {/* Course Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {selectedCourse.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Level: {selectedCourse.level}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Instructor: {selectedCourse.instructorName || 'Assigned'}</span>
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h2>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{selectedCourse.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenLessonModal('video')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    title="Upload video lesson for enrolled students"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Class Video</span>
                  </button>

                  <button
                    onClick={() => handleOpenLessonModal('text')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Text Lesson</span>
                  </button>

                  <button
                    onClick={() => {
                      if (courseQuiz) {
                        setQuizForm({
                          title: courseQuiz.title,
                          description: courseQuiz.description || '',
                          passingPercentage: courseQuiz.passingPercentage,
                          timeLimitMinutes: courseQuiz.timeLimitMinutes || 15,
                          questions: courseQuiz.questions
                        });
                      }
                      setIsQuizModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{courseQuiz ? 'Edit Quiz' : 'Add MCQ Quiz'}</span>
                  </button>
                </div>
              </div>

              {/* Lessons Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Curriculum Lessons ({courseLessons.length})</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {courseLessons.map((l, idx) => (
                    <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{l.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {l.contentType.toUpperCase()} • {l.durationMinutes} mins
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingLesson(l);
                            setLessonForm({
                              title: l.title,
                              description: l.description || '',
                              contentType: l.contentType === 'video' ? 'video' : 'text',
                              videoUrl: l.videoUrl || '',
                              content: l.content,
                              durationMinutes: l.durationMinutes
                            });
                            setIsLessonModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(l.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrolled Students Progress Report */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Enrolled Student Progress Report ({progressReport.length})</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Progress Engine
                  </span>
                </div>

                {progressReport.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No students currently enrolled in this course.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Lessons Done</th>
                          <th className="py-2.5 px-3">Progress %</th>
                          <th className="py-2.5 px-3">Quiz Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {progressReport.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{r.studentName}</div>
                              <div className="text-[10px] text-slate-400">{r.studentEmail}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              {r.completedLessonsCount} / {r.totalLessons}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-indigo-600">{r.progressPercentage}%</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {r.quizScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">Select a course on the left to manage lessons, quizzes and student progress.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Create/Edit Course */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Modern Fullstack Next.js 15 & Strapi"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={courseForm.description}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detailed course summary..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option>Pure & Applied Sciences</option>
                    <option>Mathematical Sciences</option>
                    <option>Information Technology</option>
                    <option>Computer Science</option>
                    <option>Software Engineering</option>
                    <option>Software Architecture</option>
                    <option>Electrical & Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={e => setCourseForm({ ...courseForm, level: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={courseForm.thumbnailUrl}
                  onChange={e => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={courseForm.tags}
                  onChange={e => setCourseForm({ ...courseForm, tags: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="TypeScript, Next.js, Architecture"
                />
              </div>

              {/* Assign Instructor Option for Admin & Content Manager */}
              {['admin', 'content_manager'].includes(activeRole) && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Lead Instructor</label>
                  <select
                    value={courseForm.instructorId}
                    onChange={e => setCourseForm({ ...courseForm, instructorId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                  >
                    <option value="">-- Select Instructor --</option>
                    {users.filter(u => ['instructor', 'admin', 'content_manager'].includes(u.role)).map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    The assigned instructor can upload lecture videos, author lessons, and manage curriculum.
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Lesson & Class Video Upload */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingLesson ? 'Edit Lesson' : 'Upload Class Video & Lesson'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assigned course: <strong>{selectedCourse?.title}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsLessonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLessonForm({ ...lessonForm, contentType: 'video' })}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    lessonForm.contentType === 'video'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Class Video Lecture</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLessonForm({ ...lessonForm, contentType: 'text' })}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    lessonForm.contentType === 'text'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Reading Notes / Article</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson / Lecture Title</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Lecture 04: Advanced Circuit Simulation & Waveforms"
                />
              </div>

              {/* Video Specific Section */}
              {lessonForm.contentType === 'video' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Video Source</span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('upload')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          videoSourceType === 'upload'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Upload Video File
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('embed')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          videoSourceType === 'embed'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Embed URL / Stream
                      </button>
                    </div>
                  </div>

                  {videoSourceType === 'upload' ? (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.mkv"
                        onChange={handleVideoFileInput}
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setIsDraggingVideo(true); }}
                        onDragLeave={() => setIsDraggingVideo(false)}
                        onDrop={handleVideoDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isDraggingVideo 
                            ? 'border-indigo-600 bg-indigo-50/70' 
                            : 'border-slate-300 hover:border-indigo-400 bg-white'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-bounce" />
                        <div className="font-bold text-slate-800">
                          {uploadedFileName ? 'Change Selected Video' : 'Click to Upload Video File or Drag & Drop'}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Supports MP4, WebM, MOV, MKV • Full HD video stream playback
                        </p>
                      </div>

                      {uploadedFileName && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileVideo className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{uploadedFileName}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded font-bold shrink-0">
                            {uploadedFileSize}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Video Embed / Direct Stream URL (YouTube, Vimeo, Cloud Storage)
                      </label>
                      <input
                        type="url"
                        value={lessonForm.videoUrl}
                        onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://www.youtube.com/embed/... or https://domain.com/video.mp4"
                      />
                    </div>
                  )}

                  {/* Video Live Preview Player */}
                  {lessonForm.videoUrl && (
                    <div className="mt-3 space-y-1.5">
                      <label className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Video Lecture Live Preview:</span>
                      </label>
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-300 relative">
                        {lessonForm.videoUrl.startsWith('blob:') || lessonForm.videoUrl.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i) ? (
                          <video
                            src={lessonForm.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <iframe
                            src={lessonForm.videoUrl}
                            title="Video Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonForm.durationMinutes}
                    onChange={e => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lecture Brief / Summary</label>
                  <input
                    type="text"
                    value={lessonForm.description}
                    onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="Short description of this session..."
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Lecture Notes / Transcript (Markdown)</label>
                <textarea
                  rows={4}
                  value={lessonForm.content}
                  onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs"
                  placeholder="## Class Notes&#10;- Key architectural formula&#10;- Code repository references"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save & Publish Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: MCQ Quiz Builder */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                MCQ Quiz Editor & Auto-Grading Rules
              </h3>
              <button onClick={() => setIsQuizModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pass %</label>
                  <input
                    type="number"
                    value={quizForm.passingPercentage}
                    onChange={e => setQuizForm({ ...quizForm, passingPercentage: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-3">
                <h4 className="font-bold text-slate-800">MCQ Questions:</h4>
                {quizForm.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-3.5 bg-slate-50 border rounded-xl space-y-2">
                    <label className="font-bold text-slate-700 block">Question {qIdx + 1}</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => {
                        const newQ = [...quizForm.questions];
                        newQ[qIdx].question = e.target.value;
                        setQuizForm({ ...quizForm, questions: newQ });
                      }}
                      className="w-full p-2 border rounded-lg bg-white"
                    />

                    <div className="space-y-1.5 pt-1">
                      <span className="font-semibold text-slate-600 block">Options & Correct Selection:</span>
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correctOptionId === opt.id}
                            onChange={() => {
                              const newQ = [...quizForm.questions];
                              newQ[qIdx].correctOptionId = opt.id;
                              setQuizForm({ ...quizForm, questions: newQ });
                            }}
                          />
                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => {
                              const newQ = [...quizForm.questions];
                              newQ[qIdx].options[optIdx].text = e.target.value;
                              setQuizForm({ ...quizForm, questions: newQ });
                            }}
                            className="flex-1 p-1.5 border rounded bg-white text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="font-semibold text-slate-600 block mt-1">Answer Explanation (for student):</label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={e => {
                          const newQ = [...quizForm.questions];
                          newQ[qIdx].explanation = e.target.value;
                          setQuizForm({ ...quizForm, questions: newQ });
                        }}
                        className="w-full p-1.5 border rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
