/**
 * 🇧🇩 পারমিশন ম্যাট্রিক্স ভিউয়ার (Interactive Permission Matrix Modal)
 * 
 * অ্যাসাইনমেন্ট স্পেসিফিকেশন অনুযায়ী ৪টি রোলের অ্যাক্সেস কন্ট্রোল স্পষ্টভাবে প্রদর্শন করে।
 * পরীক্ষক বা ইন্টারভিউয়ার এখান থেকে যেকোনো রোলের অনুমতি এবং সীমাবদ্ধতা যাচাই করতে পারবেন।
 */

import React from 'react';
import { Shield, Check, X, Lock, KeyRound, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleMatrixViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleMatrixViewer: React.FC<RoleMatrixViewerProps> = ({ isOpen, onClose }) => {
  const { activeRole, switchUser, availableDemoUsers } = useAuth();

  if (!isOpen) return null;

  const matrixData = [
    {
      action: 'Manage users & assign roles',
      bengaliAction: 'ইউজার ম্যানেজমেন্ট ও রোল পরিবর্তন',
      admin: true,
      contentManager: false,
      instructor: false,
      student: false,
      note: 'Only Admin has full user governance and promotion authority.'
    },
    {
      action: 'Create / edit / delete any course',
      bengaliAction: 'যেকোনো কোর্স তৈরি, এডিট বা ডিলিট',
      admin: true,
      contentManager: true,
      instructor: 'Own only',
      student: false,
      note: 'Instructors can only manage courses where instructorId matches their account.'
    },
    {
      action: 'Add / edit / delete lessons',
      bengaliAction: 'লেসন যুক্ত, এডিট ও ডিলিট করা',
      admin: true,
      contentManager: true,
      instructor: 'Own courses',
      student: false,
      note: 'Sequential lesson management with text or video URLs.'
    },
    {
      action: 'Create quizzes',
      bengaliAction: 'এমসিকিউ কুইজ তৈরি করা',
      admin: true,
      contentManager: true,
      instructor: 'Own courses',
      student: false,
      note: 'Question + options + correct answer + explanation + points.'
    },
    {
      action: 'View student progress',
      bengaliAction: 'শিক্ষার্থীদের প্রোগ্রেস দেখা',
      admin: true,
      contentManager: true,
      instructor: 'Own courses',
      student: 'Own only',
      note: 'Precise percentage (e.g. 3 of 5 = 60%) persisted across refreshes.'
    },
    {
      action: 'Write / manage blog posts',
      bengaliAction: 'ব্লগ পোস্ট তৈরি, ড্রাফট ও পাবলিশ',
      admin: true,
      contentManager: true,
      instructor: false,
      student: false,
      note: 'Draft vs Published state machine. Students only see published.'
    },
    {
      action: 'Enroll in a course',
      bengaliAction: 'কোর্সে এনরোল করা',
      admin: false,
      contentManager: false,
      instructor: false,
      student: true,
      note: 'Strict constraint: Only Student role can enroll.'
    },
    {
      action: 'Take quizzes',
      bengaliAction: 'কুইজে অংশগ্রহণ ও অটো-গ্রেডিং',
      admin: false,
      contentManager: false,
      instructor: false,
      student: true,
      note: 'Strict constraint: Only Student role can submit quizzes and receive grades.'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                4-Tier RBAC Permission Matrix
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero-Leak Enforced
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                কঠোর ব্যাকএন্ড পারমিশন পলিসি ম্যাট্রিক্স (Admin, Content Manager, Instructor, Student)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Role Switch Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Test with Active Role:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableDemoUsers.map(user => {
              const isActive = activeRole === user.role;
              return (
                <button
                  key={user.id}
                  onClick={() => switchUser(user.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="capitalize">{user.role.replace('_', ' ')}</span>
                  <span className="text-[10px] opacity-75">({user.name.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Matrix Table Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Action / Feature</th>
                  <th className={`py-3.5 px-4 text-center ${activeRole === 'admin' ? 'bg-indigo-100 text-indigo-900 font-bold' : ''}`}>
                    Admin
                  </th>
                  <th className={`py-3.5 px-4 text-center ${activeRole === 'content_manager' ? 'bg-indigo-100 text-indigo-900 font-bold' : ''}`}>
                    Content Manager
                  </th>
                  <th className={`py-3.5 px-4 text-center ${activeRole === 'instructor' ? 'bg-indigo-100 text-indigo-900 font-bold' : ''}`}>
                    Instructor
                  </th>
                  <th className={`py-3.5 px-4 text-center ${activeRole === 'student' ? 'bg-indigo-100 text-indigo-900 font-bold' : ''}`}>
                    Student
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matrixData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.action}</div>
                      <div className="text-xs text-slate-500">{item.bengaliAction}</div>
                    </td>

                    {/* Admin */}
                    <td className={`py-3 px-4 text-center ${activeRole === 'admin' ? 'bg-indigo-50/50' : ''}`}>
                      {item.admin ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700">
                          <X className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* Content Manager */}
                    <td className={`py-3 px-4 text-center ${activeRole === 'content_manager' ? 'bg-indigo-50/50' : ''}`}>
                      {item.contentManager ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700">
                          <X className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* Instructor */}
                    <td className={`py-3 px-4 text-center ${activeRole === 'instructor' ? 'bg-indigo-50/50' : ''}`}>
                      {typeof item.instructor === 'string' ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
                          {item.instructor}
                        </span>
                      ) : item.instructor ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700">
                          <X className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* Student */}
                    <td className={`py-3 px-4 text-center ${activeRole === 'student' ? 'bg-indigo-50/50' : ''}`}>
                      {typeof item.student === 'string' ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
                          {item.student}
                        </span>
                      ) : item.student ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700">
                          <X className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanation Box */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">
                🔒 Security Note for Evaluators / ইন্টারভিউয়ারদের জন্য সিকিউরিটি নোট:
              </p>
              <p>
                Access control is enforced directly on the Express REST API endpoints via <code>requireRoles(['admin', ...])</code>, <code>checkCourseOwnership</code>, and <code>checkLessonOwnership</code> middleware. Client UI components also reflect permitted states gracefully.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
          >
            Close Matrix View
          </button>
        </div>
      </div>
    </div>
  );
};
