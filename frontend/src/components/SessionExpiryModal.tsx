import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

export const SessionExpiryModal: React.FC = () => {
  const { isSessionExpiringSoon, sessionRemainingSeconds, extendSession, logout, environment } = useAuth();

  if (!isSessionExpiringSoon) return null;

  const minutes = Math.floor(sessionRemainingSeconds / 60);
  const seconds = sessionRemainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Session Expiring Soon</h3>
            <p className="text-xs text-slate-500">
              Inactivity timeout protection
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
          <div className="text-xs text-amber-900 font-semibold">
            Your active session will expire automatically due to inactivity in:
          </div>
          <div className="text-3xl font-black font-mono text-amber-700 tracking-wider flex items-center justify-center gap-2">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          To maintain security and protect your progress, inactive sessions are automatically terminated. Would you like to extend your active session?
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => extendSession(30)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Extend (+30 Mins)</span>
          </button>
          
          <button
            onClick={logout}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>

      </div>
    </div>
  );
};
