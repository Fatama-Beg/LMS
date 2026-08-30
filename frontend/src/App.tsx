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
  const { currentUser, isLoading } = useAuth();
  
  // Navigation & Active View State
  const [currentView, setCurrentView] = useState<string>('auth');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Modal dialog states
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Redirect unauthenticated users to auth view
  useEffect(() => {
    if (!isLoading && !currentUser) {
      setCurrentView('auth');
    }
  }, [currentUser, isLoading]);

  // Route to initial dashboard based on authenticated role
  const handleAuthSuccess = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentView('admin');
    } else if (role === 'instructor') {
      setCurrentView('studio');
    } else if (role === 'content_manager') {
      setCurrentView('catalog');
    } else {
      setCurrentView('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global navigation handler
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
      
      {/* Top Navbar Header (Rendered only for authenticated sessions) */}
      {currentUser && currentView !== 'auth' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenMatrix={() => setIsMatrixOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1 pb-16">
        {(!currentUser || currentView === 'auth') ? (
          <AuthView onSuccess={handleAuthSuccess} />
        ) : (
          <>
            {currentView === 'catalog' && (
              <CatalogView
                onSelectCourse={handleSelectCourse}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'my-courses' && (
              <MyCoursesView
                onSelectCourse={handleSelectCourse}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'lesson' && activeCourseId && (
              <LessonView
                courseId={activeCourseId}
                onBack={() => setCurrentView('catalog')}
                onTakeQuiz={handleTakeQuiz}
              />
            )}

            {currentView === 'quiz' && activeQuizId && (
              <QuizView
                quizId={activeQuizId}
                onBack={() => setCurrentView('lesson')}
                onViewGradebook={() => setCurrentView('gradebook')}
              />
            )}

            {currentView === 'studio' && (
              <CourseStudioView />
            )}

            {currentView === 'admin' && (
              <AdminView />
            )}

            {currentView === 'blog' && (
              <BlogView />
            )}

            {currentView === 'gradebook' && (
              <GradebookView />
            )}

            {currentView === 'profile' && (
              <ProfileView onNavigate={handleNavigate} />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <RoleMatrixViewer
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

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
