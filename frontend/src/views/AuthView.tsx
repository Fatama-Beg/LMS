import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  LogIn, 
  UserPlus, 
  GraduationCap, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight,
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (role: UserRole) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { loginWithEmail, registerUser, availableDemoUsers } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('student@lms.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = loginEmail.trim();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginWithEmail(email, 1440);
      if (success) {
        const matched = availableDemoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        const role = matched?.role || 'student';
        onSuccess(role);
      } else {
        setError('Invalid email or password. Please check your credentials or create a new account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      const success = await registerUser(regName.trim(), regEmail.trim(), regRole, '', 1440);
      if (success) {
        onSuccess(regRole);
      } else {
        setError('Unable to complete registration. This email may already be registered.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-view-container" className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Clean Logo and Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-1">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Educore LMS
          </h1>
          <p className="text-xs text-slate-500">
            {activeTab === 'login'
              ? 'Sign in to access your courses and learning dashboard'
              : 'Create an account to begin your learning journey'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'login' ? (
          /* Sign In Form */
          <div className="space-y-4 text-xs">
            {/* Quick Demo User Selector */}
            <div>
              <label className="font-semibold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
                Quick Demo Sign In
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'student', label: '🎓 Student', email: 'student@lms.com' },
                  { role: 'instructor', label: '👨‍🏫 Instructor', email: 'instructor@lms.com' },
                  { role: 'admin', label: '🛡️ Admin', email: 'admin@lms.com' },
                  { role: 'content_manager', label: '✍️ Content Mgr', email: 'content@lms.com' },
                ].map(demo => (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoginEmail(demo.email);
                      setLoginPassword('password123');
                      setIsLoading(true);
                      try {
                        const success = await loginWithEmail(demo.email, 1440);
                        if (success) {
                          onSuccess(demo.role as UserRole);
                        }
                      } catch (err: any) {
                        setError(err?.message || 'Login failed');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-indigo-50/80 hover:border-indigo-200 text-slate-800 hover:text-indigo-700 font-medium text-left transition-all cursor-pointer flex items-center justify-between group text-[11px]"
                  >
                    <span>{demo.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-slate-400 text-[10px] uppercase font-semibold">Or use credentials</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSuccessMsg('Demo mode: you can log in with any password or select a quick demo profile above.')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Create Account Form */
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Account Role
              </label>
              <select
                value={regRole}
                onChange={e => setRegRole(e.target.value as UserRole)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <option value="student">Student (Learn courses & take quizzes)</option>
                <option value="instructor">Instructor (Publish courses & manage content)</option>
                <option value="content_manager">Content Manager (Review & curate curriculum)</option>
                <option value="admin">Administrator (Full LMS portal control)</option>
              </select>
            </div>

            <div className="pt-0.5">
              <label className="flex items-start gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-[11px] leading-tight">
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 disabled:opacity-50 mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted and secure authentication</span>
        </div>

      </div>
    </div>
  );
};
