import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, UserSession } from '../types';
import { api, setActiveUserToken, clearActiveSession } from '../services/api';

interface SessionEnvironment {
  host: string;
  isLocalhost: boolean;
  port: number;
  nodeEnv: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentSession: UserSession | null;
  userSessions: UserSession[];
  sessionRemainingSeconds: number;
  isSessionExpiringSoon: boolean;
  environment: SessionEnvironment;
  isLoading: boolean;
  activeRole: UserRole | 'guest';
  availableDemoUsers: User[];
  switchUser: (userId: string) => Promise<void>;
  sendVerificationCode: (payload: { email: string; type: 'login' | 'register'; name?: string; role?: UserRole; bio?: string }) => Promise<{ success: boolean; message: string; email: string; codePreview?: string; expiresAt?: string }>;
  verifyCodeAndAuthenticate: (email: string, code: string, timeoutMinutes?: number) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail: (email: string, timeoutMinutes?: number) => Promise<boolean>;
  registerUser: (name: string, email: string, role: UserRole, bio?: string, timeoutMinutes?: number) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  extendSession: (minutes?: number) => Promise<boolean>;
  setSessionTimeout: (minutes: number) => Promise<boolean>;
  fetchUserSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  revokeAllOtherSessions: () => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (action: string) => boolean;
}

// Pre-configured default users for demonstration and testing
export const DEMO_USERS: User[] = [
  {
    id: 'usr_admin_01',
    name: 'Tanvir Ahmed',
    email: 'admin@lms.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Platform Administrator with superuser privileges across system and role assignments.',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'usr_cm_01',
    name: 'Farhana Rahman',
    email: 'content@lms.com',
    role: 'content_manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bio: 'Curriculum architect and blog editor managing all platform courses and publications.',
    createdAt: '2026-08-05T00:00:00.000Z',
  },
  {
    id: 'usr_inst_01',
    name: 'Dr. Rafiqul Islam',
    email: 'instructor@lms.com',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Senior Fullstack Software Architect specializing in TypeScript, Next.js & System Design.',
    createdAt: '2026-08-10T00:00:00.000Z',
  },
  {
    id: 'usr_inst_02',
    name: 'Nusrat Jahan',
    email: 'nusrat@lms.com',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Cloud Architect & DevOps Specialist with focus on Strapi, Docker and Railway deployment.',
    createdAt: '2026-08-12T00:00:00.000Z',
  },
  {
    id: 'usr_stud_01',
    name: 'Shakib Al Hasan',
    email: 'student@lms.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Aspiring Software Engineer taking fullstack web development and distributed systems.',
    createdAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'usr_stud_02',
    name: 'Amina Khatun',
    email: 'amina@lms.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Frontend enthusiast exploring React design patterns and TypeScript architectures.',
    createdAt: '2026-08-18T00:00:00.000Z',
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(0);
  const [environment, setEnvironment] = useState<SessionEnvironment>({
    host: typeof window !== 'undefined' ? window.location.host : 'localhost:3000',
    isLocalhost: true,
    port: 3000,
    nodeEnv: 'development'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastActivityRef = useRef<number>(Date.now());

  // Load session and user details from backend
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('educore_session_token') || localStorage.getItem('lms_active_user_id')) : null;
      if (!storedToken) {
        setCurrentUser(null);
        setCurrentSession(null);
        setIsLoading(false);
        return;
      }

      const [sessionRes, sessionsRes] = await Promise.all([
        api.getSession().catch(() => null),
        api.getUserSessions().catch(() => null)
      ]);

      if (sessionRes && sessionRes.success && sessionRes.user) {
        setCurrentUser(sessionRes.user);
        setCurrentSession(sessionRes.session || null);
        setSessionRemainingSeconds(sessionRes.remainingSeconds || 0);
        if (sessionRes.environment) {
          setEnvironment({
            host: sessionRes.environment.host,
            isLocalhost: sessionRes.environment.isLocalhost,
            port: sessionRes.environment.port || 3000,
            nodeEnv: sessionRes.environment.nodeEnv || 'development'
          });
        }
      } else {
        // Fallback profile fetch
        const res = await api.getMe().catch(() => null);
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          if (res.session) setCurrentSession(res.session);
        } else {
          setCurrentUser(null);
          setCurrentSession(null);
        }
      }

      if (sessionsRes && sessionsRes.success) {
        setUserSessions(sessionsRes.sessions || []);
      }
    } catch (err) {
      console.warn('Session check failed', err);
      const storedId = localStorage.getItem('lms_active_user_id');
      if (storedId) {
        const fallback = DEMO_USERS.find(u => u.id === storedId) || null;
        setCurrentUser(fallback);
      } else {
        setCurrentUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Live session countdown timer
  useEffect(() => {
    if (!currentUser || !currentSession) return;

    const timer = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, currentSession]);

  const fetchUserSessions = async () => {
    try {
      const res = await api.getUserSessions();
      if (res.success) {
        setUserSessions(res.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch user sessions:', err);
    }
  };

  // Switch active user role
  const switchUser = async (userId: string) => {
    setIsLoading(true);
    setActiveUserToken(userId);
    const targetUser = DEMO_USERS.find(u => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
    try {
      await refreshUser();
    } catch (err) {
      console.warn('Switch user fallback used', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (payload: {
    email: string;
    type: 'login' | 'register';
    name?: string;
    role?: UserRole;
    bio?: string;
  }): Promise<{ success: boolean; message: string; email: string; codePreview?: string; expiresAt?: string }> => {
    try {
      setIsLoading(true);
      const res = await api.sendVerificationCode(payload);
      return res;
    } catch (err: any) {
      console.error('Send verification code error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCodeAndAuthenticate = async (
    email: string,
    code: string,
    timeoutMinutes?: number
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await api.verifyCode({ email, code, timeoutMinutes });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.session) {
          setCurrentSession(res.session);
          setSessionRemainingSeconds((res.session.timeoutMinutes || 1440) * 60);
        }
        await fetchUserSessions();
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Verification failed' };
    } catch (err: any) {
      console.error('Verify code error:', err);
      return { success: false, error: err.message || 'Verification failed. Invalid or expired code.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, timeoutMinutes?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.login(email, timeoutMinutes).catch(() => null);
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        if (res.session) {
          setCurrentSession(res.session);
          setSessionRemainingSeconds((res.session.timeoutMinutes || 1440) * 60);
        }
        await fetchUserSessions().catch(() => {});
        return true;
      }
      
      // Fallback for standalone / static environments (e.g. Vercel)
      const cleanEmail = email.toLowerCase().trim();
      const matched = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
      const userToLogin: User = matched || {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Student account',
        createdAt: new Date().toISOString()
      };
      
      setActiveUserToken(userToLogin.id);
      setCurrentUser(userToLogin);
      setSessionRemainingSeconds(1440 * 60);
      return true;
    } catch (err) {
      console.warn('Backend login fallback triggered:', err);
      const cleanEmail = email.toLowerCase().trim();
      const matched = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
      const userToLogin: User = matched || {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Student account',
        createdAt: new Date().toISOString()
      };
      
      setActiveUserToken(userToLogin.id);
      setCurrentUser(userToLogin);
      setSessionRemainingSeconds(1440 * 60);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, role: UserRole, bio?: string, timeoutMinutes?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.register({ name, email, role, bio, timeoutMinutes });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.session) {
          setCurrentSession(res.session);
          setSessionRemainingSeconds((res.session.timeoutMinutes || 1440) * 60);
        }
        await fetchUserSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend register failed, creating local session:', err);
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: bio || '',
        createdAt: new Date().toISOString()
      };
      setActiveUserToken(newUser.id);
      setCurrentUser(newUser);
      setSessionRemainingSeconds(1440 * 60);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const extendSession = async (minutes: number = 30): Promise<boolean> => {
    try {
      const res = await api.extendSession(minutes);
      if (res.success && res.session) {
        setCurrentSession(res.session);
        setSessionRemainingSeconds(res.remainingSeconds);
        await fetchUserSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Extend session error:', err);
      return false;
    }
  };

  const setSessionTimeout = async (minutes: number): Promise<boolean> => {
    try {
      const res = await api.setSessionTimeout(minutes);
      if (res.success && res.session) {
        setCurrentSession(res.session);
        setSessionRemainingSeconds(minutes * 60);
        await fetchUserSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Set session timeout error:', err);
      return false;
    }
  };

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      const res = await api.revokeSession(sessionId);
      if (res.success) {
        if (currentSession?.id === sessionId) {
          logout();
        } else {
          await fetchUserSessions();
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Revoke session error:', err);
      return false;
    }
  };

  const revokeAllOtherSessions = async (): Promise<boolean> => {
    try {
      const res = await api.revokeAllOtherSessions();
      if (res.success) {
        await fetchUserSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Revoke all sessions error:', err);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.updateProfile(updates);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        const idx = DEMO_USERS.findIndex(u => u.id === res.user.id);
        if (idx !== -1) {
          DEMO_USERS[idx] = { ...DEMO_USERS[idx], ...res.user };
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update profile error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    clearActiveSession();
    setCurrentUser(null);
    setCurrentSession(null);
    setUserSessions([]);
    setSessionRemainingSeconds(0);
  };

  // Client-side permission evaluator
  const hasPermission = (action: string): boolean => {
    if (!currentUser) return action === 'read_published_blogs';
    const role = currentUser.role;

    switch (action) {
      case 'manage_users':
        return role === 'admin';
      case 'create_any_course':
      case 'edit_any_course':
        return role === 'admin' || role === 'content_manager';
      case 'create_own_course':
      case 'edit_own_course':
        return role === 'admin' || role === 'content_manager' || role === 'instructor';
      case 'add_lesson':
      case 'create_quiz':
        return role === 'admin' || role === 'content_manager' || role === 'instructor';
      case 'view_all_progress':
        return role === 'admin' || role === 'content_manager';
      case 'view_own_course_progress':
        return role === 'admin' || role === 'content_manager' || role === 'instructor';
      case 'view_own_student_progress':
        return role === 'student';
      case 'write_blogs':
      case 'manage_blogs':
        return role === 'admin' || role === 'content_manager';
      case 'enroll_course':
      case 'take_quiz':
        return role === 'student';
      case 'read_published_blogs':
        return true;
      default:
        return false;
    }
  };

  const isSessionExpiringSoon = sessionRemainingSeconds > 0 && sessionRemainingSeconds <= 120;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSession,
        userSessions,
        sessionRemainingSeconds,
        isSessionExpiringSoon,
        environment,
        isLoading,
        activeRole: currentUser?.role || 'guest',
        availableDemoUsers: DEMO_USERS,
        switchUser,
        sendVerificationCode,
        verifyCodeAndAuthenticate,
        loginWithEmail,
        registerUser,
        updateProfile,
        extendSession,
        setSessionTimeout,
        fetchUserSessions,
        revokeSession,
        revokeAllOtherSessions,
        logout,
        refreshUser,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
