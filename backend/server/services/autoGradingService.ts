/**
 * 🇧🇩 অটো-গ্রেডিং সার্ভিস (Quiz Auto-Grading Engine)
 * ডিজাইন প্যাটার্ন: স্ট্র্যাটেজি প্যাটার্ন (Strategy Pattern)
 * 
 * কুইজ সাবমিট করার সাথে সাথে ব্যাকএন্ড স্বয়ংক্রিয়ভাবে উত্তরগুলো মূল্যায়ন করে,
 * সঠিক ও ভুল উত্তর চিহ্নিত করে, মোট পয়েন্ট ও শতকরা হার নির্ণয় করে এবং পাস/ফেল নির্ধারণ করে।
 */

import { Quiz, QuizSubmission, QuizQuestion } from '../../src/types';
import { DatabaseRepository } from '../repositories/database';

export interface GradingEvaluationResult {
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  questionResults: {
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    explanation?: string;
  }[];
}

const db = DatabaseRepository.getInstance();

export class AutoGradingService {
  /**
   * 🇧🇩 স্ট্র্যাটেজি প্যাটার্ন অনুযায়ী অটো-গ্রেডিং গণনা
   * @param quiz মূল্যায়নযোগ্য কুইজ
   * @param studentAnswers ছাত্রের প্রদত্ত উত্তরসমূহ (questionId -> selectedOptionId)
   */
  public static evaluateQuiz(quiz: Quiz, studentAnswers: Record<string, string>): GradingEvaluationResult {
    let score = 0;
    let totalPoints = 0;

    const questionResults = quiz.questions.map((q: QuizQuestion) => {
      const selectedOptionId = studentAnswers[q.id] || '';
      const isCorrect = selectedOptionId === q.correctOptionId;
      const points = q.points || 10;
      totalPoints += points;

      const pointsEarned = isCorrect ? points : 0;
      score += pointsEarned;

      return {
        questionId: q.id,
        questionText: q.question,
        selectedOptionId,
        correctOptionId: q.correctOptionId,
        isCorrect,
        pointsEarned,
        explanation: q.explanation
      };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passingThreshold = quiz.passingPercentage || 70;
    const isPassed = percentage >= passingThreshold;

    return {
      score,
      totalPoints,
      percentage,
      isPassed,
      questionResults
    };
  }

  /**
   * 🇧🇩 কুইজ সাবমিশন সেভ এবং গ্রেড ফলাফল সংরক্ষণ
   */
  public static submitAndGrade(
    quizId: string,
    studentId: string,
    studentName: string,
    answers: Record<string, string>
  ): { submission: QuizSubmission; evaluation: GradingEvaluationResult } {
    const quiz = db.getQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // মূল্যায়ন গণনা
    const evaluation = this.evaluateQuiz(quiz, answers);

    // সাবমিশন রেকর্ড তৈরি
    const submission: QuizSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      quizId: quiz.id,
      courseId: quiz.courseId,
      studentId,
      studentName,
      answers,
      score: evaluation.score,
      totalPoints: evaluation.totalPoints,
      percentage: evaluation.percentage,
      isPassed: evaluation.isPassed,
      submittedAt: new Date().toISOString()
    };

    db.saveSubmission(submission);

    // অডিট লগ সংরক্ষণ
    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId: studentId,
      userName: studentName,
      userRole: 'student',
      action: 'QUIZ_SUBMISSION',
      details: `Student scored ${evaluation.score}/${evaluation.totalPoints} (${evaluation.percentage}%) - ${evaluation.isPassed ? 'PASSED' : 'FAILED'} on quiz: ${quiz.title}`,
      timestamp: new Date().toISOString()
    });

    return { submission, evaluation };
  }
}
