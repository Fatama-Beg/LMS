/**
 * 🇧🇩 গ্রেডবুক ও কুইজ ফলাফল ভিউ (Gradebook & Quiz Submission Results)
 * 
 * ছাত্র এবং ইন্সট্রাক্টরদের জন্য কুইজের অর্জিত স্কোর, পাস/ফেল স্ট্যাটাস ও টাইমস্ট্যাম্প প্রদর্শন করে।
 */

import React, { useState, useEffect } from 'react';
import { QuizSubmission } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle2, XCircle, Clock, Search, BookOpen } from 'lucide-react';

export const GradebookView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissions();
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentUser, activeRole]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="w-8 h-8 text-indigo-600" />
          <span>Quiz Assessment Gradebook</span>
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          {activeRole === 'student'
            ? 'Your personal quiz attempt scores, passing verification, and evaluation records.'
            : 'Platform-wide student quiz submissions and auto-graded results.'}
        </p>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Submission Records</h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {submissions.length} Total Submissions
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading quiz records...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800">No quiz attempts recorded yet</h4>
            <p className="text-xs text-slate-500 mt-1">Take a course quiz to view your score history here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {sub.studentName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {sub.score} / {sub.totalPoints} pts
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-indigo-600 text-sm">
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sub.isPassed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Needs Retake
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
