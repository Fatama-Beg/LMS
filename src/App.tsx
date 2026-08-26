/**
 * 🇧🇩 ইন্টারভিউ ব্যাখ্যা ও আর্কিটেকচার গাইড (App.tsx):
 * 
 * ১. রুট কম্পোনেন্ট (Root View Router):
 *    - AuthProvider দিয়ে পুরো অ্যাপ র‍্যাপ করা (React Context API)।
 *    - currentUser যাচাই করে: ইউজার লগইন না থাকলে শুধুমাত্র অথেনটিকেশন পেজ (AuthView) দেখায়,
 *      কোনো হেডার/ন্যাভবার বা কোর্স ডেটা বাইরে এক্সপোজ হয় না (Strict Security Gate)।
 * 
 * ২. স্টেট ম্যানেজমেন্ট ও ভিউ রাউটিং:
 *    - `currentView`: ক্লায়েন্ট-সাইড ডায়নামিক পেজ রাউটার (catalog, my-courses, lesson, quiz, studio, admin, blog, gradebook, profile)।
 *    - `activeCourseId` & `activeQuizId`: সক্রিয় কোর্স ও কুইজের আইডি ট্র্যাক করে।
 * 
 * ৩. ইন্টারভিউতে বলার মতো গুরুত্বপূর্ণ পয়েন্ট:
 *    - "We implemented a role-based conditional view switcher that prevents unauthenticated users
 *       from accessing protected LMS resources and renders a dedicated layout per role."
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CatalogView } from './views/CatalogView';
import { MyCoursesView } from './views/MyCoursesView';
import { LessonView } from './views/LessonView';
import { QuizView } from './views/QuizView';
import { CourseStudioView } from './views/CourseStudioView';
import { AdminView } from './views/AdminView';
import { BlogView } from './views/BlogView';
import { GradebookView } from './views/GradebookView';
import { AuthView } from './views/AuthView';
import { ProfileView } from './views/ProfileView';
import { RoleMatrixViewer } from './components/RoleMatrixViewer';
import { ExportModal } from './components/ExportModal';
import { SessionExpiryModal } from './components/SessionExpiryModal';
import { UserRole } from './types';

const LMSMain: React.FC = () => {
  // 🇧🇩 AuthContext থেকে বর্তমান লগইন করা ইউজার ও লোডিং স্টেট নেওয়া
  const { currentUser, isLoading } = useAuth();
  
  // 🇧🇩 ডায়নামিক ভিউ রাউটার স্টেট
  const [currentView, setCurrentView] = useState<string>('auth');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // 🇧🇩 মডাল স্টেট
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // 🇧🇩 ব্যবহারকারী যদি লগইন না থাকে, তবে সরাসরি Auth পেজে রাখবে
  useEffect(() => {
    if (!isLoading && !currentUser) {
      setCurrentView('auth');
    }
  }, [currentUser, isLoading]);

  // 🇧🇩 সফল লগইন হওয়ার পর নির্দিষ্ট রোল অনুযায়ী ড্যাশবোর্ড ওপেন করা
  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentView('admin'); // অ্যাডমিনের জন্য Governance & Audit Dashboard
    } else if (role === 'instructor') {
      setCurrentView('studio'); // ইন্সট্রাক্টরের জন্য Course Studio
    } else if (role === 'content_manager') {
      setCurrentView('catalog'); // কনটেন্ট ম্যানেজারের জন্য Review & Catalog
    } else {
      setCurrentView('catalog'); // স্টুডেন্টের জন্য Course Catalog
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🇧🇩 গ্লোবাল ন্যাভিগেশন হ্যান্ডলার
  const handleNavigate = (view: string, data?: any) => {
    if (typeof data === 'string') {
      setActiveCourseId(data);
    } else {
      if (data?.courseId) {
        setActiveCourseId(data.courseId);
      }
      if (data?.quizId) {
        setActiveQuizId(data.quizId);
      }
    }
    if (view === 'course-detail') {
      setCurrentView('lesson');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setCurrentView('lesson');
  };

  const handleTakeQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentView('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* 🇧🇩 শুধুমাত্র লগইন করা থাকলেই টপ ন্যাভবার হেডার দেখাবে; লগইন পেজে কোনো হেডার থাকবে না */}
      {currentUser && currentView !== 'auth' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenMatrix={() => setIsMatrixOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
        />
      )}

      {/* 🇧🇩 প্রধান ভিউ রাউটার (Main View Router) */}
      <main className="flex-1 pb-16">
        {/* যদি লগইন না থাকে, তবে সেন্ট্রালাইজড ক্লিন লগইন পেজ দেখাবে */}
        {(!currentUser || currentView === 'auth') ? (
          <AuthView onSuccess={handleAuthSuccess} />
        ) : (
          <>
            {/* কোর্স ক্যাটালগ ভিউ */}
            {currentView === 'catalog' && (
              <CatalogView
                onSelectCourse={handleSelectCourse}
                onNavigate={handleNavigate}
              />
            )}

            {/* স্টুডেন্টের এনরোল করা কোর্স ভিউ */}
            {currentView === 'my-courses' && (
              <MyCoursesView
                onSelectCourse={handleSelectCourse}
                onNavigate={handleNavigate}
              />
            )}

            {/* সিকোয়েন্সিয়াল লেকচার প্লেয়ার ভিউ */}
            {currentView === 'lesson' && activeCourseId && (
              <LessonView
                courseId={activeCourseId}
                onBack={() => setCurrentView('catalog')}
                onTakeQuiz={handleTakeQuiz}
              />
            )}

            {/* এমসিকিউ কুইজ পরীক্ষা ও অটো-গ্রেডিং ভিউ */}
            {currentView === 'quiz' && activeQuizId && (
              <QuizView
                quizId={activeQuizId}
                onBack={() => setCurrentView('lesson')}
                onViewGradebook={() => setCurrentView('gradebook')}
              />
            )}

            {/* ইন্সট্রাক্টর কোর্স ও কুইজ ক্রিয়েটর স্টুডিও */}
            {currentView === 'studio' && (
              <CourseStudioView />
            )}

            {/* অ্যাডমিন গভর্নেন্স ও অডিট লগ ভিউ */}
            {currentView === 'admin' && (
              <AdminView />
            )}

            {/* ব্লগ আর্টিকেল ও CMS ভিউ */}
            {currentView === 'blog' && (
              <BlogView />
            )}

            {/* কুইজ ফলাফল ও গ্রেডবুক ভিউ */}
            {currentView === 'gradebook' && (
              <GradebookView />
            )}

            {/* প্রোফাইল ও অ্যাক্টিভ সেশন ম্যানেজার */}
            {currentView === 'profile' && (
              <ProfileView onNavigate={handleNavigate} />
            )}
          </>
        )}
      </main>

      {/* 🇧🇩 গ্লোবাল আরব্যাক ম্যাট্রিক্স ভিউয়ার মডাল */}
      <RoleMatrixViewer
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* 🇧🇩 প্রোজেক্ট এক্সপোর্ট ও কোড জিপ ডাউনলোড মডাল */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* 🇧🇩 সেশন এক্সপায়ার নোটিফিকেশন মডাল */}
      {currentUser && <SessionExpiryModal />}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LMSMain />
    </AuthProvider>
  );
}
