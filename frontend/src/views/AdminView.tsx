/**
 * 🇧🇩 অ্যাডমিন ড্যাশবোর্ড ও ডেটাবেস টেবিল ম্যানেজার (Admin Dashboard & Full Database Table Explorer)
 * 
 * রিকোয়ারমেন্ট:
 * - A dedicated admin dashboard, accessible only to the admin role.
 * - Admin can see and manage all database tables (Users, Courses, Lessons, Quizzes, Submissions, Enrollments, Blog Posts, Audit Logs, Active Sessions).
 * - Real-time inspection, row counts, filtering, search, and editing capabilities.
 */

import React, { useState, useEffect } from 'react';
import { User, PlatformStats, AuditLog, UserRole, Course, Lesson, Quiz, QuizSubmission, BlogPost, Enrollment, UserSession } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  BookOpen,
  Library,
  Award,
  FileText,
  UserCheck,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  UserPlus,
  Video,
  Database,
  Table,
  Search,
  Key,
  Layers,
  Clock,
  Eye,
  Terminal,
  Server
} from 'lucide-react';

type DatabaseTableTab = 'overview' | 'users' | 'courses' | 'lessons' | 'quizzes' | 'submissions' | 'blogs' | 'audit_logs';

export const AdminView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<DatabaseTableTab>('overview');
  
  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, coursesRes, blogsRes, submissionsRes] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getAuditLogs(),
        api.getCourses(),
        api.getBlogs(),
        api.getSubmissions()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (logsRes.success) setAuditLogs(logsRes.logs);
      if (coursesRes.success) {
        setCourses(coursesRes.courses);
        // Load lessons from all courses
        const allLessons: Lesson[] = [];
        for (const c of coursesRes.courses) {
          try {
            const detailRes = await api.getCourseDetails(c.id);
            if (detailRes.success && detailRes.lessons) {
              allLessons.push(...detailRes.lessons);
            }
          } catch (e) {
            // Ignore single course lesson error
          }
        }
        setLessons(allLessons);
      }
      if (blogsRes.success) setBlogs(blogsRes.blogs);
      if (submissionsRes.success) setSubmissions(submissionsRes.submissions);
    } catch (err: any) {
      console.error('Failed to load admin database tables', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === 'admin') {
      fetchAdminData();
    }
  }, [activeRole]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        setFeedback(`Successfully changed role to ${newRole.toUpperCase()}`);
        setTimeout(() => setFeedback(null), 3000);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAssignInstructor = async (courseId: string, instructorId: string) => {
    try {
      setAssigningCourseId(courseId);
      const res = await api.assignInstructor(courseId, instructorId);
      if (res.success) {
        setFeedback(`Successfully assigned instructor to "${res.course.title}"`);
        setTimeout(() => setFeedback(null), 3000);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign instructor');
    } finally {
      setAssigningCourseId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(userId);
        fetchAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course from the database?')) {
      try {
        await api.deleteCourse(courseId);
        fetchAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete course');
      }
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await api.deleteBlog(blogId);
        fetchAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete blog');
      }
    }
  };

  if (activeRole !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Clearance Required</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          The Admin Panel & Database Explorer is strictly accessible only to the <strong>Admin</strong> role. Please switch to Tanvir Ahmed (Admin) using the top navigation switcher.
        </p>
      </div>
    );
  }

  // Filter lists based on search query
  const q = searchQuery.toLowerCase().trim();
  const filteredUsers = users.filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q));
  const filteredCourses = courses.filter(c => !q || c.title.toLowerCase().includes(c) || c.category.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q));
  const filteredLessons = lessons.filter(l => !q || l.title.toLowerCase().includes(q) || l.contentType.includes(q));
  const filteredBlogs = blogs.filter(b => !q || b.title.toLowerCase().includes(q) || b.authorName.toLowerCase().includes(q) || b.status.includes(q));
  const filteredSubmissions = submissions.filter(s => !q || s.studentName.toLowerCase().includes(q) || s.quizId.includes(q));
  const filteredAuditLogs = auditLogs.filter(a => !q || a.action.toLowerCase().includes(q) || a.details.toLowerCase().includes(q) || a.userName.toLowerCase().includes(q));

  const tableSummary = [
    { id: 'users', name: 'Users Table', icon: Users, count: users.length, description: 'User profiles, passwords, role permissions' },
    { id: 'courses', name: 'Courses Table', icon: BookOpen, count: courses.length, description: 'Course metadata, thumbnail, level, category' },
    { id: 'lessons', name: 'Lessons Table', icon: Video, count: lessons.length, description: 'Sequential video & markdown lesson units' },
    { id: 'blogs', name: 'Blog Posts Table', icon: FileText, count: blogs.length, description: 'Drafts and published technical articles' },
    { id: 'submissions', name: 'Quiz Submissions', icon: Award, count: submissions.length, description: 'Auto-graded student scores and answers' },
    { id: 'audit_logs', name: 'Audit Logs Table', icon: Activity, count: auditLogs.length, description: 'System events, role changes, course creation' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3" />
              Database Engine & Admin Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-purple-600" />
            <span>Database Tables & Platform Administration</span>
          </h1>
          <p className="text-xs text-slate-600">
            Real-time inspection and management across all 7 database schemas, relations, and system governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh All Tables</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Platform Stats Metrics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Total Users</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-100">
              <span>Admin: {stats.usersByRole.admin}</span>
              <span>•</span>
              <span>CM: {stats.usersByRole.content_manager}</span>
              <span>•</span>
              <span>Inst: {stats.usersByRole.instructor}</span>
              <span>•</span>
              <span>Stud: {stats.usersByRole.student}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Total Courses</span>
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalCourses}</div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>{stats.totalLessons} Total Lessons across Platform</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Enrollments</span>
              <Library className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalEnrollments}</div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Active student course subscriptions</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Avg Quiz Score</span>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.averageQuizScore}%</div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>From {stats.totalQuizzesTaken} Total Submissions</span>
            </div>
          </div>
        </div>
      )}

      {/* Database Explorer Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Overview</span>
          </button>

          {tableSummary.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DatabaseTableTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar inside database viewer */}
        {activeTab !== 'overview' && (
          <div className="pt-3 px-2 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search records in ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Schema: <span className="text-purple-700 font-bold">db.{activeTab}</span>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 1. OVERVIEW TAB: SCHEMA CARDS & ARCHITECTURE         */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tableSummary.map((tbl) => {
              const Icon = tbl.icon;
              return (
                <div
                  key={tbl.id}
                  onClick={() => setActiveTab(tbl.id as DatabaseTableTab)}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-slate-900">{tbl.count}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                      {tbl.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{tbl.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-600 font-bold">
                    <span>View & Manage Records</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Database System Specifications */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 font-mono text-xs shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400">Database Engine Status: CONNECTED & SYNCHRONIZED</span>
              </div>
              <span className="text-slate-400 text-[11px]">Storage: Auto-Persisted JSON / SQLite / PostgreSQL Ready</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400">Primary Storage File</div>
                <div className="font-bold text-white mt-1">/data/lms-store.json</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400">Auth / Role Engine</div>
                <div className="font-bold text-white mt-1">RBAC Multi-Tier (4 Roles)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400">Auto-Grading & Audit</div>
                <div className="font-bold text-emerald-400 mt-1">Enabled (Real-time Stream)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. USERS TABLE                                       */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Users Database Table ({filteredUsers.length} records)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name & Profile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role (RBAC)</th>
                  <th className="py-3 px-4">Assign / Change Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{user.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <span className="font-bold text-slate-900">{user.name}</span>
                          {isSelf && <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">You</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : user.role === 'content_manager'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : user.role === 'instructor'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          disabled={isSelf || updatingUserId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="content_manager">Content Manager</option>
                          <option value="instructor">Instructor</option>
                          <option value="student">Student</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. COURSES TABLE                                     */}
      {/* ==================================================== */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Courses Database Table ({filteredCourses.length} records)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Course ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Assigned Instructor</th>
                  <th className="py-3 px-4">Assign Instructor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => {
                  const instructorsList = users.filter(u => ['instructor', 'admin', 'content_manager'].includes(u.role));
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{course.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={course.thumbnailUrl} alt={course.title} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">{course.title}</div>
                            <div className="text-[10px] text-slate-400">{course.lessonsCount || 0} Lessons • {course.totalDurationMinutes} mins</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{course.category}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {course.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{course.instructorName || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={course.instructorId}
                          disabled={assigningCourseId === course.id}
                          onChange={(e) => handleAssignInstructor(course.id, e.target.value)}
                          className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          {instructorsList.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name} ({inst.role.replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. LESSONS TABLE                                     */}
      {/* ==================================================== */}
      {activeTab === 'lessons' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>Lessons Database Table ({filteredLessons.length} records)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Lesson ID</th>
                  <th className="py-3 px-4">Course ID</th>
                  <th className="py-3 px-4">Lesson Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Content Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLessons.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{l.id}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-600">{l.courseId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{l.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 uppercase">
                        {l.contentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">#{l.order}</td>
                    <td className="py-3 px-4 text-slate-600">{l.durationMinutes} mins</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{l.content || l.videoUrl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. BLOG POSTS TABLE                                  */}
      {/* ==================================================== */}
      {activeTab === 'blogs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Blog CMS Database Table ({filteredBlogs.length} records)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Post ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlogs.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{b.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{b.title}</td>
                    <td className="py-3 px-4 text-slate-700">{b.authorName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.category}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteBlog(b.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. QUIZ SUBMISSIONS TABLE                            */}
      {/* ==================================================== */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Quiz Auto-Grading Submissions Table ({filteredSubmissions.length} records)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Submission ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Quiz ID</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Submitted Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{s.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.studentName}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600">{s.quizId}</td>
                    <td className="py-3 px-4 font-mono">{s.score} / {s.totalPoints}</td>
                    <td className="py-3 px-4 font-bold">{s.percentage}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. AUDIT LOGS TABLE                                  */}
      {/* ==================================================== */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Live System Audit Logs Table ({filteredAuditLogs.length} events)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Actor (User)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[10px]">{log.id}</td>
                    <td className="py-3 px-4 text-indigo-700 font-bold">[{log.action}]</td>
                    <td className="py-3 px-4 text-slate-800 font-sans">{log.details}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase font-sans">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
