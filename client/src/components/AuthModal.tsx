import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, initialTab = 'REGISTER' }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tab === 'LOGIN') {
        await login(username || email, password);
      } else {
        await register(username, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
              <img src="/logo.png" alt="PitchPredict" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-white">PitchPredict Official Portal</h2>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Real Accounts
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">All predictions & statistics backed by official accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('REGISTER'); setErrorMsg(null); }}
            className={`flex-1 py-3 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'REGISTER'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('LOGIN'); setErrorMsg(null); }}
            className={`flex-1 py-3 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'LOGIN'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 pb-safe">
          {/* Database Trust Notice */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-bold block mb-0.5">Cloud Database Verification</span>
              Your account and predictions are recorded on the official database ledger, ensuring verified accuracy across leaderboards and past prediction histories.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'REGISTER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Official Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. striker_pro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">3-25 letters, numbers, or underscores</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {tab === 'REGISTER' ? 'Real Email Address' : 'Username or Email'}
              </label>
              <input
                type={tab === 'REGISTER' ? 'email' : 'text'}
                required
                value={tab === 'REGISTER' ? email : username}
                onChange={(e) =>
                  tab === 'REGISTER' ? setEmail(e.target.value) : setUsername(e.target.value)
                }
                placeholder={tab === 'REGISTER' ? 'your.name@domain.com' : 'Enter username or email'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {tab === 'REGISTER' && (
                <span className="text-[10px] text-slate-500 mt-1 block">Minimum 6 characters</span>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 min-h-[44px] active:scale-95"
            >
              {tab === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>
                {loading
                  ? 'Authenticating...'
                  : tab === 'LOGIN'
                  ? 'Sign In to Official Account'
                  : 'Create Official Account (Start with 0 Pts)'}
              </span>
            </button>
          </form>

          {/* Features bullet points */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Real Accounts Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Supabase Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>10 Picks / Day in Basic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Official History Ledger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
