/**
 * 🇧🇩 অ্যাডমিন ড্যাশবোর্ড ও রোল ম্যানেজমেন্ট (Admin Dashboard & User Role Governance)
 * 
 * রিকোয়ারমেন্ট:
 * - A dedicated admin dashboard, accessible only to the admin role.
 * - Admin can see all users and manage their roles (promote / change / remove a user's role).
 * - Admin can view and manage all courses, lessons, and blog posts across the platform.
 * - Show basic platform stats (total users per role, total courses, total enrollments).
 */

import React, { useState, useEffect } from 'react';
import { User, PlatformStats, AuditLog, UserRole, Course } from '../types';
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
  Video
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, coursesRes] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getAuditLogs(),
        api.getCourses()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (logsRes.success) setAuditLogs(logsRes.logs);
      if (coursesRes.success) setCourses(coursesRes.courses);
    } catch (err: any) {
      console.error('Failed to load admin data', err);
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

  if (activeRole !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Clearance Required</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          The Admin Panel is strictly accessible only to the <strong>Admin</strong> role. Please switch to Tanvir Ahmed (Admin) using the top navigation switcher.
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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
              Superuser Clearance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-purple-600" />
            <span>Platform Admin Control Center</span>
          </h1>
          <p className="text-xs text-slate-600">
            Full governance across all users, 4-tier role assignments, system metrics, and audit activities.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Platform Stats Grid */}
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

      {/* User Governance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>User & Role Governance Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Promote, change, or remove roles for any user on the platform.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            {users.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Assign / Change Role</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        disabled={isSelf || updatingUserId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="content_manager">Content Manager</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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

      {/* Course & Assigned Instructor Governance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Course & Assigned Instructor Governance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin-assigned instructors gain dedicated permissions to upload class videos, author lessons, and manage curriculum.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg self-start sm:self-auto border border-indigo-100">
            {courses.length} Active Courses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Category & Level</th>
                <th className="py-3.5 px-4">Currently Assigned Instructor</th>
                <th className="py-3.5 px-4">Assign / Reassign Instructor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => {
                const isAssigning = assigningCourseId === course.id;
                const instructorsList = users.filter(u => ['instructor', 'admin', 'content_manager'].includes(u.role));

                return (
                  <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate" title={course.title}>
                            {course.title}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{course.lessonsCount || 0} Lessons</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">{course.totalDurationMinutes} mins</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{course.category}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        course.level === 'Advanced'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : course.level === 'Intermediate'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {course.level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={course.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={course.instructorName || 'Instructor'}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{course.instructorName || 'Unassigned'}</div>
                          <span className="text-[10px] text-indigo-600 font-medium">Assigned by Admin</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={course.instructorId}
                          disabled={isAssigning}
                          onChange={(e) => handleAssignInstructor(course.id, e.target.value)}
                          className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 min-w-[200px]"
                        >
                          {instructorsList.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name} ({inst.role.replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                        {isAssigning && (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <span>Live System Audit Logs</span>
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-indigo-700">[{log.action}]</span>
                <span className="text-slate-700 ml-2">{log.details}</span>
                <span className="text-slate-400 text-[10px] ml-2">by {log.userName} ({log.userRole})</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
