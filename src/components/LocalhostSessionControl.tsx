import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Server, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  LogOut, 
  Trash2, 
  Key, 
  Globe, 
  Laptop, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const LocalhostSessionControl: React.FC = () => {
  const {
    currentUser,
    currentSession,
    userSessions,
    sessionRemainingSeconds,
    environment,
    extendSession,
    setSessionTimeout,
    revokeSession,
    revokeAllOtherSessions,
    logout,
    fetchUserSessions
  } = useAuth();

  const [copiedToken, setCopiedToken] = useState(false);
  const [selectedTimeout, setSelectedTimeout] = useState<number>(
    currentSession?.timeoutMinutes || 1440
  );
  const [isUpdatingTimeout, setIsUpdatingTimeout] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchUserSessions();
  }, []);

  useEffect(() => {
    if (currentSession?.timeoutMinutes) {
      setSelectedTimeout(currentSession.timeoutMinutes);
    }
  }, [currentSession]);

  const formatRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleCopyToken = () => {
    if (currentSession?.token) {
      navigator.clipboard.writeText(currentSession.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleTimeoutChange = async (minutes: number) => {
    setSelectedTimeout(minutes);
    setIsUpdatingTimeout(true);
    const success = await setSessionTimeout(minutes);
    setIsUpdatingTimeout(false);
    if (success) {
      setActionFeedback(`Session timeout updated to ${minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} mins`}.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleExtend = async (minutes: number = 30) => {
    setIsExtending(true);
    const success = await extendSession(minutes);
    setIsExtending(false);
    if (success) {
      setActionFeedback(`Session extended by ${minutes} minutes.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const totalTimeoutSeconds = (currentSession?.timeoutMinutes || 1440) * 60;
  const progressPercent = Math.min(100, Math.max(0, (sessionRemainingSeconds / totalTimeoutSeconds) * 100));

  return (
    <div className="space-y-6">
      
      {/* Action Notification */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Active Session Lifetime & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Active Session & Inactivity Control</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage token expiration, inactivity lifecycles, and device termination.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExtend(30)}
              disabled={isExtending}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtending ? 'animate-spin' : ''}`} />
              <span>+30 Mins</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        {/* Live Countdown & Progress Bar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Remaining Session Duration:</span>
            </div>
            <span className="text-sm font-black font-mono text-indigo-700">
              {formatRemaining(sessionRemainingSeconds)}
            </span>
          </div>

          {/* Visual Progress Meter */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                progressPercent > 20 ? 'bg-indigo-600' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Session ID: <code className="font-mono text-slate-700">{currentSession?.id || 'sid_active_01'}</code></span>
            <span>Expires: <span className="font-mono text-slate-700">{currentSession?.expiresAt ? new Date(currentSession.expiresAt).toLocaleTimeString() : 'In 24 hours'}</span></span>
          </div>
        </div>

        {/* Session Token & Inactivity Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          
          {/* Timeout Duration Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Session Inactivity Timeout:
            </label>
            <select
              value={selectedTimeout}
              onChange={e => handleTimeoutChange(Number(e.target.value))}
              disabled={isUpdatingTimeout}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={15}>15 Minutes (High Security)</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={360}>6 Hours</option>
              <option value={720}>12 Hours</option>
              <option value={1440}>24 Hours (Standard)</option>
              <option value={10080}>7 Days (Extended)</option>
            </select>
          </div>

          {/* Session Token Preview & Copy */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Bearer Session Token:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentSession?.token || 'sess_demo_token_active'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopyToken}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shrink-0"
                title="Copy session token"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Concurrent Active Sessions List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-indigo-600" />
              <span>Active Connected Devices</span>
            </h3>
            <p className="text-xs text-slate-500">
              Review concurrent browser sessions connected to your account.
            </p>
          </div>

          {userSessions.filter(s => s.isValid).length > 1 && (
            <button
              onClick={revokeAllOtherSessions}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke All Other Sessions</span>
            </button>
          )}
        </div>

        {userSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active session records found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                <tr>
                  <th className="p-3">Device / Host</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userSessions.map((sess) => {
                  const isCurrent = sess.isCurrent || sess.id === currentSession?.id;
                  return (
                    <tr key={sess.id} className={isCurrent ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50'}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Laptop className={`w-4 h-4 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <div>
                            <span className="font-bold text-slate-800">{sess.userAgent || 'Localhost Web Client'}</span>
                            {isCurrent && (
                              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                                This Session
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {sess.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(sess.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {sess.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {sess.isValid && (
                          <button
                            onClick={() => isCurrent ? logout() : revokeSession(sess.id)}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-[11px] transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          >
                            {isCurrent ? 'Terminate' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
