import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { firebaseSync } from '@/lib/firebaseSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const { showToast } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        showToast('Signed in successfully with Firebase', 'success');
      } else {
        await signUpWithEmail(email, password, name);
        showToast('Account created and cloud database linked', 'success');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Connected with Google Firebase Account', 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out from cloud sync', 'info');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="overlay-bg absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md glass-card-elevated p-6 border border-[rgba(214,188,134,0.22)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(214,188,134,0.1)] mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D6BC86]/15 text-[#D6BC86]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#F5F1E8] font-serif tracking-tight">
                  {user ? 'Cloud Database Connected' : 'Firebase Cloud Sync'}
                </h3>
                <span className="text-[10px] text-[#77736D] uppercase tracking-wider block">
                  Private Wealth Vault
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#77736D] hover:text-[#F5F1E8] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* User already signed in view */}
          {user ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#17171B] border border-[rgba(214,188,134,0.3)] mx-auto flex items-center justify-center text-xl font-bold text-[#D6BC86] shadow-lg">
                {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-medium text-[#F5F1E8]">
                  {user.displayName || 'Authenticated Investor'}
                </p>
                <p className="text-xs text-[#77736D] mt-0.5 font-mono">{user.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#83C9A5]/10 border border-[#83C9A5]/25 flex items-center gap-2 text-xs text-[#83C9A5] text-left">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span>Real-time Firestore synchronization active. Ledger changes automatically sync to your cloud vault.</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast('Testing database write...', 'info');
                      await firebaseSync.saveTransaction(user.uid, {
                        id: 'tx_ping_' + Date.now(),
                        type: 'income',
                        amount: 1,
                        description: 'Cloud Connection Verification Ping',
                        category: 'Others',
                        date: new Date().toISOString(),
                        paymentMethod: 'Other',
                        createdAt: new Date().toISOString(),
                      });
                      showToast('Database write confirmed! Refresh Firebase Console.', 'success');
                    } catch (err: any) {
                      console.error('Write failed:', err);
                      showToast('Database write error: ' + (err.message || 'Check Firestore rules'), 'error');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                >
                  Verify & Push Test Record to Firestore
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl bg-[#17171B] border border-[#D98282]/30 text-[#D98282] hover:bg-[#D98282]/10 text-xs font-semibold uppercase tracking-wider transition-colors active:scale-95"
                >
                  Sign Out from Cloud
                </button>
              </div>
            </div>
          ) : !isConfigured ? (
            /* Firebase not configured banner */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#D9B46F]/10 border border-[#D9B46F]/25 text-left space-y-2">
                <div className="flex items-center gap-2 text-[#D9B46F] text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>Setup Firebase API Keys</span>
                </div>
                <p className="text-xs text-[#B6B0A5] leading-relaxed">
                  To connect your real Firebase database, simply paste your project keys into your <code className="text-[#D6BC86] bg-[#0B0B0D] px-1 py-0.5 rounded">.env</code> file.
                </p>
                <p className="text-[11px] text-[#77736D]">
                  Meanwhile, your app continues operating smoothly in <strong>local-first mode</strong> with full zero-loss local storage!
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#D6BC86] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider hover:bg-[#E9D8AF] transition-all shadow-sm"
              >
                Understood
              </button>
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#D98282]/15 border border-[#D98282]/30 text-xs text-[#D98282] leading-tight flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#17171B] border border-[rgba(214,188,134,0.22)] hover:border-[#D6BC86]/50 text-xs font-semibold text-[#F5F1E8] flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.54 0 2.94.53 4.04 1.48l3.03-3.03C17.24 1.8 14.81 1 12 1 7.42 1 3.53 3.59 1.63 7.37l3.68 2.85C6.19 7.21 8.86 5 12 5z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.85c2.15-1.99 3.74-4.91 3.74-8.67z" />
                  <path fill="#FBBC05" d="M5.31 14.78c-.24-.73-.38-1.5-.38-2.28 0-.78.14-1.55.38-2.28L1.63 7.37C.59 9.45 0 11.66 0 14s.59 4.55 1.63 6.63l3.68-2.85z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.68-2.85c-1.07.72-2.45 1.16-4.25 1.16-3.14 0-5.81-2.21-6.69-5.22L1.63 16.03C3.53 19.81 7.42 23 12 23z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[rgba(214,188,134,0.1)]" />
                <span className="text-[10px] uppercase font-semibold text-[#77736D]">or email</span>
                <div className="flex-1 h-px bg-[rgba(214,188,134,0.1)]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs text-[#B6B0A5] mb-1 block font-medium">Your Name</label>
                    <div className="relative">
                      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Johnathan Vance"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 placeholder:text-[#77736D]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-[#B6B0A5] mb-1 block font-medium">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
                    <input
                      type="email"
                      required
                      placeholder="investor@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 placeholder:text-[#77736D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#B6B0A5] mb-1 block font-medium">Master Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 placeholder:text-[#77736D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Connecting...' : mode === 'signin' ? 'Sign In & Sync' : 'Create Vault & Sync'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                  className="text-xs text-[#D6BC86] hover:text-[#E9D8AF] transition-colors"
                >
                  {mode === 'signin' ? "Don't have a cloud account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
