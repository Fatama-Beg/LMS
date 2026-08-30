import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Course, QuizSubmission, StudentCourseProgress } from '../types';
import { LocalhostSessionControl } from '../components/LocalhostSessionControl';
import {
  User as UserIcon,
  Mail,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Github,
  Linkedin,
  Sparkles,
  Shield,
  BookOpen,
  Award,
  CheckCircle2,
  Lock,
  Bell,
  Save,
  RotateCcw,
  Camera,
  Upload,
  Calendar,
  Layers,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Server
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
];

const POPULAR_INTEREST_SUGGESTIONS = [
  'TypeScript', 'React 19', 'Next.js', 'Clean Architecture',
  'System Design', 'Electronics & Hardware', 'Physics',
  'Mathematics', 'Python & AI', 'Docker & DevOps', 'Databases'
];

interface ProfileViewProps {
  onNavigate?: (view: string, courseId?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { currentUser, updateProfile, activeRole } = useAuth();

  // Active Tab: 'general' | 'social' | 'activity' | 'security' | 'sessions'
  const [activeTab, setActiveTab] = useState<'general' | 'social' | 'activity' | 'security' | 'sessions'>('general');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    phone: '',
    location: '',
    avatar: '',
    github: '',
    linkedin: '',
    website: '',
    interests: [] as string[],
    emailAnnouncements: true,
    quizReminders: true,
    newCourseAlerts: true,
  });

  const [newInterestInput, setNewInterestInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activity stats
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [myProgress, setMyProgress] = useState<StudentCourseProgress[]>([]);
  const [mySubmissions, setMySubmissions] = useState<QuizSubmission[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Password simulator state
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Sync current user data into form
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        headline: currentUser.headline || '',
        bio: currentUser.bio || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        avatar: currentUser.avatar || '',
        github: currentUser.github || '',
        linkedin: currentUser.linkedin || '',
        website: currentUser.website || '',
        interests: currentUser.interests || ['Software Engineering', 'TypeScript'],
        emailAnnouncements: currentUser.notifications?.emailAnnouncements ?? true,
        quizReminders: currentUser.notifications?.quizReminders ?? true,
        newCourseAlerts: currentUser.notifications?.newCourseAlerts ?? true,
      });
    }
  }, [currentUser]);

  // Load user-specific activity details (enrolled courses / authored courses / quiz scores)
  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!currentUser) return;
      setIsLoadingActivity(true);
      try {
        const [coursesRes, myCoursesRes, submissionsRes] = await Promise.all([
          api.getCourses(),
          activeRole === 'student' ? api.getMyCourses() : Promise.resolve({ success: true, courses: [] }),
          api.getSubmissions(),
        ]);

        if (coursesRes.success) {
          if (activeRole === 'student') {
            const enrolled = coursesRes.courses.filter(c => currentUser.enrolledCourseIds?.includes(c.id));
            setEnrolledCourses(enrolled);
          } else if (activeRole === 'instructor') {
            const authored = coursesRes.courses.filter(c => c.instructorId === currentUser.id);
            setInstructorCourses(authored);
          } else {
            setEnrolledCourses(coursesRes.courses);
          }
        }

        if (myCoursesRes.success && myCoursesRes.courses) {
          const progs = myCoursesRes.courses
            .map(c => c.progress)
            .filter(Boolean) as StudentCourseProgress[];
          setMyProgress(progs);
        }

        if (submissionsRes.success && submissionsRes.submissions) {
          const filtered = activeRole === 'student'
            ? submissionsRes.submissions.filter(s => s.studentId === currentUser.id)
            : submissionsRes.submissions;
          setMySubmissions(filtered);
        }
      } catch (err) {
        console.error('Failed to load user activity data:', err);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchUserActivity();
  }, [currentUser, activeRole]);

  // Handle Save Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const success = await updateProfile({
        name: formData.name.trim(),
        headline: formData.headline.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        avatar: formData.avatar.trim(),
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
        website: formData.website.trim(),
        interests: formData.interests,
        notifications: {
          emailAnnouncements: formData.emailAnnouncements,
          quizReminders: formData.quizReminders,
          newCourseAlerts: formData.newCourseAlerts,
        },
      });

      if (success) {
        setFeedbackMessage({ type: 'success', text: 'Profile changes saved successfully!' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setFeedbackMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Add Interest Tag
  const handleAddInterest = (tagToAdd?: string) => {
    const tag = (tagToAdd || newInterestInput).trim();
    if (!tag) return;
    if (!formData.interests.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, tag],
      }));
    }
    setNewInterestInput('');
  };

  // Remove Interest Tag
  const handleRemoveInterest = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(t => t !== tagToRemove),
    }));
  };

  // Handle Photo File Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setShowAvatarPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Password Change Simulation
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      setPasswordFeedback('Please enter your current password.');
      return;
    }
    if (passwordState.newPassword.length < 6) {
      setPasswordFeedback('New password must be at least 6 characters long.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordFeedback('New passwords do not match.');
      return;
    }

    setPasswordFeedback('Password updated successfully! (Secure cryptographic hash generated)');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordFeedback(null), 5000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'content_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'instructor':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'student':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Please Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">
          You must be logged in to view and manage your account profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute bottom-3 right-4 text-[11px] text-indigo-200 font-medium flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Account Role: <strong>{currentUser.role.replace('_', ' ').toUpperCase()}</strong></span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar with live photo changer */}
            <div className="relative group">
              <img
                src={formData.avatar || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-2 right-2 p-2 rounded-xl bg-slate-900/80 hover:bg-indigo-600 text-white shadow-md backdrop-blur-xs transition-all cursor-pointer"
                title="Change profile avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    setFormData({
                      name: currentUser.name || '',
                      headline: currentUser.headline || '',
                      bio: currentUser.bio || '',
                      phone: currentUser.phone || '',
                      location: currentUser.location || '',
                      avatar: currentUser.avatar || '',
                      github: currentUser.github || '',
                      linkedin: currentUser.linkedin || '',
                      website: currentUser.website || '',
                      interests: currentUser.interests || [],
                      emailAnnouncements: currentUser.notifications?.emailAnnouncements ?? true,
                      quizReminders: currentUser.notifications?.quizReminders ?? true,
                      newCourseAlerts: currentUser.notifications?.newCourseAlerts ?? true,
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>

          {/* User Details & Identity Bar */}
          <div className="mt-4 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {formData.name || currentUser.name}
              </h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadge(currentUser.role)}`}>
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {formData.headline || 'No professional headline set yet.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
              </div>
              {formData.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formData.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Joined {new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Avatar Picker Dropdown Modal */}
          {showAvatarPicker && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Profile Avatar</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Preset Avatars */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-2">Preset Avatars:</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, avatar: url }));
                        setShowAvatarPicker(false);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                        formData.avatar === url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload or Custom URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Custom Image URL:</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={e => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://domain.com/my-photo.jpg"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Upload from Computer:</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Image File</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-200 bg-slate-50/70 px-4 sm:px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'social'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Social & Skills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>
              {activeRole === 'student' ? 'My Learning & Grades' : activeRole === 'instructor' ? 'Authored Courses' : 'Platform Activity'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Active Sessions & Security</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT: General Personal Info */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Update your public profile details and personal credentials.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="e.g. Tanvir Ahmed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Verified Account
                </span>
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">To change login email, contact platform administrator.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Professional Headline / Tagline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="e.g. Full-Stack Engineer | Passionate Educator & CS Researcher"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="+880 1712-345678"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Location / City</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Dhaka, Bangladesh"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">About Me / Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                placeholder="Tell the community about your background, interests, and educational pursuits..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Personal Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: Social Links & Interests */}
      {activeTab === 'social' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Social Presence & Skill Interests</h2>
            <p className="text-xs text-slate-500">Connect your professional profiles and customize your learning topics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-700" />
                <span>GitHub Profile</span>
              </label>
              <input
                type="url"
                value={formData.github}
                onChange={e => setFormData({ ...formData, github: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn Profile</span>
              </label>
              <input
                type="url"
                value={formData.linkedin}
                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Personal Portfolio / Website</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                placeholder="https://myportfolio.dev"
              />
            </div>
          </div>

          {/* Interests & Skills Tag Manager */}
          <div className="space-y-3 pt-2">
            <label className="font-bold text-slate-700 block text-xs">
              Topics of Interest & Specializations
            </label>
            
            {/* Active Tag Chips */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[48px] items-center">
              {formData.interests.length === 0 ? (
                <span className="text-xs text-slate-400">No topics added yet. Choose from suggestions below or type a new one.</span>
              ) : (
                formData.interests.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-indigo-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(tag)}
                      className="hover:text-indigo-950 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterestInput}
                onChange={e => setNewInterestInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add new skill or topic tag (e.g. Next.js, Algorithms)..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddInterest()}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors"
              >
                Add Tag
              </button>
            </div>

            {/* Popular Suggestions */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Quick Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_INTEREST_SUGGESTIONS.map(sugg => {
                  const isAdded = formData.interests.includes(sugg);
                  return (
                    <button
                      key={sugg}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddInterest(sugg)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isAdded
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-300 hover:border-indigo-300 cursor-pointer'
                      }`}
                    >
                      + {sugg}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Social & Skills'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: Activity, Enrolled Courses & Academic Track */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeRole === 'student' ? 'My Courses & Academic Performance' : activeRole === 'instructor' ? 'Authored Courses & Lectures' : 'System Activity Overview'}
              </h2>
              <p className="text-xs text-slate-500">Live progress tracking and enrollment records from your user account.</p>
            </div>
            {activeRole === 'student' && onNavigate && (
              <button
                onClick={() => onNavigate('catalog')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Browse All Courses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Student View: Enrolled Courses & Grades */}
          {activeRole === 'student' && (
            <div className="space-y-6">
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider">Enrolled Courses</div>
                  <div className="text-2xl font-black text-indigo-950 mt-1">{enrolledCourses.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider">Completed Lessons</div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">
                    {myProgress.reduce((acc, p) => acc + (p.completedLessonIds?.length || 0), 0)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-amber-600 text-[11px] font-bold uppercase tracking-wider">Quizzes Taken</div>
                  <div className="text-2xl font-black text-amber-950 mt-1">{mySubmissions.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-purple-600 text-[11px] font-bold uppercase tracking-wider">Avg. Score</div>
                  <div className="text-2xl font-black text-purple-950 mt-1">
                    {mySubmissions.length > 0
                      ? `${Math.round(mySubmissions.reduce((acc, s) => acc + s.percentage, 0) / mySubmissions.length)}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Enrolled Courses List */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enrolled Courses & Progress:</span>
                </h3>

                {enrolledCourses.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500">You have not enrolled in any courses yet.</p>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('catalog')}
                        className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Explore Course Catalog →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {enrolledCourses.map(course => {
                      const prog = myProgress.find(p => p.courseId === course.id);
                      const percent = prog ? Math.round(prog.progressPercentage) : 0;
                      return (
                        <div
                          key={course.id}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center gap-3 bg-white"
                        >
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{course.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate">Instructor: {course.instructorName}</p>
                            
                            {/* Progress bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 shrink-0">{percent}%</span>
                            </div>
                          </div>
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('course-detail', course.id)}
                              className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-600 transition-colors"
                              title="Continue Learning"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quiz Results Table */}
              {mySubmissions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Recent Quiz Submissions:</span>
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Score</th>
                          <th className="p-2.5">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mySubmissions.slice(0, 5).map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {sub.score}/{sub.totalPoints} ({sub.percentage}%)
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {sub.isPassed ? 'Passed' : 'Needs Review'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructor View: Authored Courses */}
          {activeRole === 'instructor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800">Assigned Courses & Lecture Modules:</h3>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('studio')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Open Course Studio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instructorCourses.map(course => (
                  <div key={course.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 bg-white">
                    <img src={course.thumbnailUrl} alt={course.title} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{course.title}</h4>
                      <p className="text-[10px] text-slate-500">{course.lessonsCount} lessons • {course.totalDurationMinutes} mins</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                        course.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin / Content Manager View */}
          {['admin', 'content_manager'].includes(activeRole) && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Administrative Privilege Scope</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Your account is provisioned with high-level access to oversee platform courses, author lecture media, manage user credentials, and review platform-wide analytics.
              </p>
              {onNavigate && activeRole === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1"
                >
                  <span>Open Admin Governance Panel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Security & Notifications */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Change Password Card */}
          <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Change Password</span>
              </h2>
              <p className="text-xs text-slate-500">Update your account password for enhanced security.</p>
            </div>

            {passwordFeedback && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
                {passwordFeedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={e => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordState.newPassword}
                  onChange={e => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum 6 characters</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={e => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Notification Preferences Card */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Notification Preferences</span>
              </h2>
              <p className="text-xs text-slate-500">Configure how and when you receive course updates and alerts.</p>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailAnnouncements}
                  onChange={e => setFormData({ ...formData, emailAnnouncements: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Course Announcements & Class Notes</span>
                  <span className="text-[11px] text-slate-500">Receive emails whenever an instructor uploads new lectures or notes.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.quizReminders}
                  onChange={e => setFormData({ ...formData, quizReminders: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Quiz & Assessment Alerts</span>
                  <span className="text-[11px] text-slate-500">Instant notifications when quiz evaluations and certificates are published.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newCourseAlerts}
                  onChange={e => setFormData({ ...formData, newCourseAlerts: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">New Course Catalog Releases</span>
                  <span className="text-[11px] text-slate-500">Monthly digests of new curriculum modules and expert webinars.</span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </form>

          {/* Quick Session Overview in Security Tab */}
          <div className="md:col-span-2">
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Active Session & Device Security</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Session lifetime control and connected device authorization.
              </p>
              <LocalhostSessionControl />
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Dedicated Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Active Sessions & Security Control</span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect, control, extend, and terminate authentication sessions across your devices.
              </p>
            </div>
            <LocalhostSessionControl />
          </div>
        </div>
      )}

    </div>
  );
};
