import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Library,
  Layers,
  Shield,
  FileText,
  Award,
  ChevronDown,
  User as UserIcon,
  FolderArchive,
  RefreshCw,
  LogOut,
  Sparkles,
  Server,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getActiveBackendUrl, setCustomBackendUrl } from '../services/api';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenMatrix: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenMatrix,
  onOpenExport
}) => {
  const { 
    currentUser, 
    activeRole, 
    logout, 
    sessionRemainingSeconds,
    environment,
    extendSession
  } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(getActiveBackendUrl() || 'https://lms-backend-production-e908.up.railway.app');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'standalone'>('checking');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.checkBackendConnection().then(res => {
      if (mounted) {
        setBackendStatus(res.online ? 'connected' : 'standalone');
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSaveBackendUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setCustomBackendUrl(backendUrlInput.trim());
    const res = await api.checkBackendConnection();
    setBackendStatus(res.online ? 'connected' : 'standalone');
    setTestingConnection(false);
    setIsBackendModalOpen(false);
    window.location.reload();
  };

  const formatShortTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // 🇧🇩 ভূমিকা অনুযায়ী ব্যাজ কালার
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-200';
      case 'content_manager':
        return 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-200';
      case 'instructor':
        return 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-200';
      case 'student':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200';
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all demo data (courses, progress, quiz submissions) to default state?')) {
      try {
        setIsResetting(true);
        await api.resetDemoData();
        window.location.reload();
      } catch (err) {
        console.error('Failed to reset', err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('catalog')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block">Educore</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider block">
                  Learning Platform
                </span>
              </div>
            </button>

            {/* Navigation Links (Only shown when authenticated) */}
            {currentUser && (
              <nav className="hidden lg:flex items-center gap-1 ml-4">
                <button
                  onClick={() => onNavigate('catalog')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'catalog'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Course Catalog
                </button>

                {/* Student specific */}
                {activeRole === 'student' && (
                  <button
                    onClick={() => onNavigate('my-courses')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentView === 'my-courses'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    My Courses
                  </button>
                )}

                {/* Instructor / Content Manager / Admin Course Studio */}
                {(activeRole === 'instructor' || activeRole === 'content_manager' || activeRole === 'admin') && (
                  <button
                    onClick={() => onNavigate('studio')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentView === 'studio'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Course Studio
                  </button>
                )}

                {/* Blog Portal */}
                <button
                  onClick={() => onNavigate('blog')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'blog'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Blog CMS
                </button>

                {/* Gradebook / Submissions */}
                <button
                  onClick={() => onNavigate('gradebook')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'gradebook'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Quiz Results
                </button>

                {/* Profile Portal */}
                <button
                  onClick={() => onNavigate('profile')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>

                {/* Admin Panel */}
                {activeRole === 'admin' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-purple-600" />
                    Admin Panel
                  </button>
                )}
              </nav>
            )}
          </div>

          {/* Right Action: Active User Role Switcher, Backend Status & Sign In Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Backend Connectivity Status Button */}
            <button
              onClick={() => setIsBackendModalOpen(true)}
              title="Click to configure Strapi / Railway Backend API connection"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                backendStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">
                {backendStatus === 'connected' ? 'Live Backend' : 'Demo Mode'}
              </span>
              <Server className="w-3.5 h-3.5 opacity-70" />
            </button>

            {!currentUser ? (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              /* User Profile & Account Menu */
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser?.name || 'User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(activeRole)}`}>
                        {activeRole.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
                </button>

                {/* Dropdown Menu */}
                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {currentUser.email}
                        </p>
                        <div className="mt-1">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(activeRole)}`}>
                            {activeRole.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          logout();
                          onNavigate('auth');
                        }}
                        className="w-full text-left text-xs font-bold text-rose-600 hover:text-rose-700 py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Navigation bar (Only when authenticated) */}
      {currentUser && (
        <div className="lg:hidden flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 overflow-x-auto">
          <button
            onClick={() => onNavigate('catalog')}
            className={`px-3 py-1.5 rounded-lg ${currentView === 'catalog' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
          >
            Catalog
          </button>
          {activeRole === 'student' && (
            <button
              onClick={() => onNavigate('my-courses')}
              className={`px-3 py-1.5 rounded-lg ${currentView === 'my-courses' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
            >
              My Courses
            </button>
          )}
          {(activeRole === 'instructor' || activeRole === 'content_manager' || activeRole === 'admin') && (
            <button
              onClick={() => onNavigate('studio')}
              className={`px-3 py-1.5 rounded-lg ${currentView === 'studio' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
            >
              Studio
            </button>
          )}
          <button
            onClick={() => onNavigate('blog')}
            className={`px-3 py-1.5 rounded-lg ${currentView === 'blog' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
          >
            Blog
          </button>
          <button
            onClick={() => onNavigate('gradebook')}
            className={`px-3 py-1.5 rounded-lg ${currentView === 'gradebook' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
          >
            Grades
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`px-3 py-1.5 rounded-lg ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
          >
            Profile
          </button>
          {activeRole === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-lg ${currentView === 'admin' ? 'bg-purple-50 text-purple-700 font-bold' : ''}`}
            >
              Admin
            </button>
          )}
        </div>
      )}

      {/* Backend Connection Modal */}
      {isBackendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Backend API Settings</h3>
              </div>
              <button
                onClick={() => setIsBackendModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Educore LMS works seamlessly in <strong>two modes</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li><strong className="text-slate-700">Live Railway/Strapi Backend:</strong> Synchronizes courses, progress, and quizzes with your live server.</li>
                <li><strong className="text-slate-700">Standalone Resilient Mode:</strong> Full interactive LMS with local storage persistence and mock data.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div>
                <span className="font-semibold text-slate-800">Current Status: </span>
                <span className={backendStatus === 'connected' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {backendStatus === 'connected' ? 'Connected to Live Server' : 'Running in Offline / Demo Mode'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveBackendUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Strapi / Railway Backend URL:
                </label>
                <input
                  type="url"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="https://lms-backend-production-e908.up.railway.app"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave empty to run in zero-config standalone offline mode.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBackendUrlInput('https://lms-backend-production-e908.up.railway.app');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  Use Railway Default
                </button>
                <button
                  type="submit"
                  disabled={testingConnection}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
