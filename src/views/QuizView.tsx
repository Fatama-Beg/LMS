/**
 * 🇧🇩 কুইজ ও অটো-গ্রেডিং ভিউ (MCQ Quiz Engine & Instant Evaluation View)
 * 
 * রিকোয়ারমেন্ট:
 * - Student takes the quiz and gets an automatic score immediately on submit.
 * - The student's quiz result is stored and viewable later.
 * - Auto-grading logic: Strategy pattern evaluation, score computation, percentage calculation.
 * - Strict constraint: Only students can submit quizzes.
 */

import React, { useState, useEffect } from 'react';
import { Quiz, QuizSubmission, QuizQuestion } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  quizId: string;
  onBack: () => void;
  onViewGradebook: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quizId, onBack, onViewGradebook }) => {
  const { currentUser, activeRole } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submission: QuizSubmission;
    evaluation: any;
  } | null>(null);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      // Fetch quiz by searching submissions or courses
      const coursesRes = await api.getCourses();
      if (coursesRes.success) {
        for (const c of coursesRes.courses) {
          const detail = await api.getCourseDetails(c.id);
          if (detail.quiz && (detail.quiz.id === quizId || detail.quiz.courseId === c.id)) {
            setQuiz(detail.quiz);
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load quiz', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submissionResult) return; // Locked once submitted
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    if (activeRole !== 'student') {
      alert('Quiz submission is reserved for Student accounts. Please switch to a Student profile to participate and record grades.');
      return;
    }

    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < quiz.questions.length) {
      if (!window.confirm(`You answered ${answeredCount} of ${quiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitQuiz(quiz.id, selectedAnswers);
      if (res.success) {
        setSubmissionResult(res as any);
        if (res.evaluation.isPassed) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmissionResult(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading MCQ Quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-600 font-medium">Quiz not found for this course.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lesson Viewer</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Time Limit: {quiz.timeLimitMinutes || 15} Mins</span>
        </div>
      </div>

      {/* Role Warning Banner if Non-Student */}
      {activeRole !== 'student' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> You are currently signed in as <strong>{activeRole.toUpperCase()}</strong>. Only students can submit quizzes. Switch to Student role in top navbar to test live auto-grading.
            </span>
          </div>
        </div>
      )}

      {/* Quiz Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Auto-Graded MCQ Assessment
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-xs text-slate-600">{quiz.description}</p>
            )}
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Passing Threshold</span>
            <span className="text-xl font-black text-slate-900">{quiz.passingPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Evaluation Results Banner (If Submitted) */}
      {submissionResult && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
            submissionResult.evaluation.isPassed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-2xl ${
                  submissionResult.evaluation.isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Instant Auto-Grading Complete
                </span>
                <h2 className="text-2xl font-extrabold">
                  {submissionResult.evaluation.isPassed
                    ? '🎉 Passed with Distinction!'
                    : 'Need More Practice'}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black">
                {submissionResult.evaluation.percentage}%
              </div>
              <div className="text-xs font-semibold opacity-80">
                Score: {submissionResult.evaluation.score} / {submissionResult.evaluation.totalPoints} Points
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/60">
            <button
              onClick={handleRetake}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={onViewGradebook}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View in Gradebook</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.questions.map((question, qIdx) => {
          const selectedOption = selectedAnswers[question.id];
          const evalResult = submissionResult?.evaluation?.questionResults?.find(
            (r: any) => r.questionId === question.id
          );

          return (
            <div
              key={question.id}
              className={`bg-white rounded-2xl border transition-all p-6 sm:p-7 space-y-4 shadow-xs ${
                evalResult
                  ? evalResult.isCorrect
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-rose-300 ring-1 ring-rose-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                    {qIdx + 1}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {question.question}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {question.points || 10} pts
                  </span>

                  {evalResult && (
                    evalResult.isCorrect ? (
                      <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700" title="Correct">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-lg bg-rose-100 text-rose-700" title="Incorrect">
                        <XCircle className="w-5 h-5" />
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Options Radio List */}
              <div className="space-y-2.5 pt-2">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrectAnswer = submissionResult && option.id === question.correctOptionId;
                  const isWrongSelected = submissionResult && isSelected && !evalResult?.isCorrect;

                  let optionStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';

                  if (isSelected && !submissionResult) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-500';
                  } else if (isCorrectAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-400';
                  } else if (isWrongSelected) {
                    optionStyle = 'border-rose-400 bg-rose-50/80 text-rose-950 font-semibold ring-1 ring-rose-300';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(question.id, option.id)}
                      disabled={Boolean(submissionResult)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{option.text}</span>
                      </div>

                      {isCorrectAnswer && (
                        <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                          Correct Answer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Note on Submission */}
              {submissionResult && question.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Explanation / ব্যাখ্যা:</span>
                    <p className="mt-0.5 text-slate-600 leading-relaxed">{question.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button Bar */}
      {!submissionResult && (
        <div className="sticky bottom-6 z-20 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-600">
            Answered: <span className="text-indigo-600 font-bold">{Object.keys(selectedAnswers).length}</span> of {quiz.questions.length} Questions
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting || activeRole !== 'student'}
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Evaluating Score...' : 'Submit Quiz & Auto-Grade'}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
