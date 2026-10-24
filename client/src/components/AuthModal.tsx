import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Play, Trophy, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { login, register, guestLogin } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'GUEST'>('GUEST');

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
      } else if (tab === 'REGISTER') {
        await register(username, email, password);
      } else {
        await guestLogin();
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGuest = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await guestLogin();
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start guest session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Join PitchPredict</h2>
              <p className="text-xs text-slate-400">Compete on real European football matches</p>
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
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => setTab('GUEST')}
            className={`flex-1 py-2.5 font-bold transition-colors ${
              tab === 'GUEST'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Instant Play
          </button>
          <button
            onClick={() => setTab('LOGIN')}
            className={`flex-1 py-2.5 font-bold transition-colors ${
              tab === 'LOGIN'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('REGISTER')}
            className={`flex-1 py-2.5 font-bold transition-colors ${
              tab === 'REGISTER'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {tab === 'GUEST' ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                <Play className="w-8 h-8 fill-slate-950 stroke-none" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instant Player Access</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Start predicting right now with zero signup. You receive 100 Basic points and 100 Serious points immediately!
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleQuickGuest}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{loading ? 'Creating Guest Session...' : 'Start Playing Instantly'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., Striker99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {tab === 'REGISTER' ? 'Email Address' : 'Username or Email'}
                </label>
                <input
                  type={tab === 'REGISTER' ? 'email' : 'text'}
                  required
                  value={tab === 'REGISTER' ? email : username}
                  onChange={(e) =>
                    tab === 'REGISTER' ? setEmail(e.target.value) : setUsername(e.target.value)
                  }
                  placeholder={tab === 'REGISTER' ? 'you@example.com' : 'Username or Email'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 mt-2"
              >
                {tab === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>
                  {loading
                    ? 'Processing...'
                    : tab === 'LOGIN'
                    ? 'Sign In to Account'
                    : 'Create Free Account (+200 pts bonus)'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
