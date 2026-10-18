import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Sparkles, TrendingUp, PiggyBank, Target, Users,
  ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2, ChevronRight,
  Zap, Compass, Award, BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

// Visual feature highlights for the left showcase side
const SHOWCASE_CARDS = [
  {
    icon: TrendingUp,
    tag: 'INTELLIGENT WEALTH',
    title: 'Precision Cashflow Analytics',
    desc: 'Real-time liquidity monitoring, luxury expense breakdown, and automated month-over-month wealth trajectory.',
    highlight: '+18.4% Net Worth Trajectory',
    metric: '$148,250.00',
    submetric: 'Liquid Asset Reserves',
    category: 'Asset Allocation'
  },
  {
    icon: PiggyBank,
    tag: 'STRATEGIC ALLOCATION',
    title: 'Disciplined Capital Budgets',
    desc: 'Bespoke monthly allocation ceilings across luxury dining, investments, travel, and operations.',
    highlight: '84% Under Envelope Ceilings',
    metric: '$12,400.00',
    submetric: 'Discretionary Surplus',
    category: 'Monthly Envelope'
  },
  {
    icon: Target,
    tag: 'GOAL ACQUISITION',
    title: 'Autonomous Milestone Vaults',
    desc: 'Automated fractional goal tracking for capital acquisitions, real estate deposits, and family endowments.',
    highlight: '92% Completed',
    metric: '$45,000 / $50,000',
    submetric: 'Geneva Portfolio Goal',
    category: 'Target Milestones'
  },
  {
    icon: Users,
    tag: 'DEBT LEDGER',
    title: 'Private Peer-to-Peer IOUs',
    desc: 'Discreet bilateral settlement tracking for lent capital, co-investments, and shared luxury expenses.',
    highlight: 'Zero Outstanding Drift',
    metric: '$3,800.00',
    submetric: 'Receivables In Escrow',
    category: 'Bilateral Escrow'
  }
];

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2-Second Auto-Slide Timer with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SHOWCASE_CARDS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await signUpWithEmail(email, password, name.trim());
      }
    } catch (err: any) {
      console.error(err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication error. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google authentication was dismissed or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const curr = SHOWCASE_CARDS[activeSlide];

  return (
    <div className="min-h-screen w-full bg-[#0B0B0D] text-[#F5F1E8] flex flex-col lg:flex-row antialiased selection:bg-[#D6BC86]/30 selection:text-[#E9D8AF]">
      {/* LEFT SIDE: Luxury Showcase with 2s Auto Flow, Live Metrics & Compact Spacing */}
      <div className="relative w-full lg:w-[50%] xl:w-[52%] bg-[#08080A] border-b lg:border-b-0 lg:border-r border-[rgba(214,188,134,0.12)] p-4 sm:p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
        {/* Subtle Ambient Backlights */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#D6BC86]/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-80 h-80 bg-[#82D9A3]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4">
          <MoneyMateLogo size={30} showText={true} />
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#121215] border border-[rgba(214,188,134,0.2)] text-[10px] sm:text-[11px] text-[#D6BC86] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#82D9A3] animate-pulse" />
            <span>CLOUD VAULT LIVE</span>
          </div>
        </div>

        {/* Center Presentation: Headline & Auto-Moving Showcase Card */}
        <div className="relative z-10 my-3 sm:my-4 max-w-xl w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6BC86]/10 border border-[#D6BC86]/25 text-[#D6BC86] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            Autonomous Wealth Infrastructure
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#F5F1E8] tracking-tight leading-tight">
            Master Your Capital with <span className="gold-text">Quiet Luxury</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#9A958C] mt-1.5 sm:mt-2 leading-relaxed">
            The private ledger designed for disciplined budgeting, real-time Firestore sync, and personal net worth clarity.
          </p>

          {/* AUTO-MOVING CAROUSEL CARD (2 SECONDS INTERVAL) */}
          <div className="mt-4 sm:mt-5 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="glass-card-elevated p-5 sm:p-6 rounded-2xl border border-[rgba(214,188,134,0.22)] bg-gradient-to-br from-[#121215]/95 via-[#15151B]/95 to-[#0F0F13]/95 relative overflow-hidden shadow-2xl"
              >
                {/* Top Row: Icon + Title + Value */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D6BC86]/15 border border-[#D6BC86]/30 flex items-center justify-center text-[#D6BC86] flex-shrink-0">
                      {React.createElement(curr.icon, { size: 19 })}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#D6BC86]">
                        {curr.tag}
                      </span>
                      <h4 className="text-sm sm:text-base font-semibold text-[#F5F1E8] tracking-tight">
                        {curr.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-bold font-mono text-[#D6BC86]">
                      {curr.metric}
                    </span>
                    <p className="text-[10px] text-[#77736D]">
                      {curr.submetric}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-[#B6B0A5] leading-relaxed mb-3.5">
                  {curr.desc}
                </p>

                {/* Progress bar ticker representing the 4-second cycle */}
                <div className="w-full bg-[#19191E] h-1 rounded-full overflow-hidden mb-3">
                  <motion.div
                    key={`progress-${activeSlide}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-[#D6BC86] to-[#82D9A3]"
                  />
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(214,188,134,0.1)]">
                  <div className="flex items-center gap-1.5 text-xs text-[#82D9A3] font-medium">
                    <CheckCircle2 size={13} />
                    <span>{curr.highlight}</span>
                  </div>
                  <span className="text-[11px] text-[#D6BC86]/80 font-mono">
                    Slide {activeSlide + 1} of {SHOWCASE_CARDS.length}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            <div className="flex items-center gap-1.5 mt-3">
              {SHOWCASE_CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-[#D6BC86]' : 'w-2 bg-[#222228] hover:bg-[#444]'
                    }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mini 3-Item Feature Ribbon to Eliminate Gaps */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[rgba(214,188,134,0.08)]">
            <div className="p-2.5 rounded-xl bg-[#121216]/60 border border-[rgba(214,188,134,0.1)] text-left">
              <Zap size={14} className="text-[#D6BC86] mb-1" />
              <p className="text-[11px] font-semibold text-[#F5F1E8]">Real-time Sync</p>
              <p className="text-[10px] text-[#77736D]">Instant Firestore</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#121216]/60 border border-[rgba(214,188,134,0.1)] text-left">
              <BarChart3 size={14} className="text-[#82D9A3] mb-1" />
              <p className="text-[11px] font-semibold text-[#F5F1E8]">Smart Budgets</p>
              <p className="text-[10px] text-[#77736D]">Envelope Control</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#121216]/60 border border-[rgba(214,188,134,0.1)] text-left">
              <ShieldCheck size={14} className="text-[#D6BC86] mb-1" />
              <p className="text-[11px] font-semibold text-[#F5F1E8]">256-Bit Vault</p>
              <p className="text-[10px] text-[#77736D]">Private & Secure</p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Row */}
        <div className="relative z-10 pt-3 border-t border-[rgba(214,188,134,0.08)] flex items-center justify-between text-xs text-[#77736D]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#D6BC86]" />
            <span>Encrypted Cloud Security</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Multi-device Realtime</span>
            <span>•</span>
            <span>Zero Telemetry</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form (Optimized Spacing & Balanced Padding) */}
      <div className="w-full lg:w-[50%] xl:w-[48%] p-6 sm:p-8 lg:p-12 flex flex-col justify-center items-center relative">
        <div className="w-full max-w-sm space-y-4">
          {/* Header */}
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F1E8] tracking-tight">
              {mode === 'signin' ? 'Access Your Vault' : 'Create Sovereign Account'}
            </h2>
            <p className="text-xs text-[#77736D]">
              {mode === 'signin'
                ? 'Sign in to access your budgets, ledger, and goals across devices.'
                : 'Initialize your private personal ledger with instant cloud backup.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-all ${mode === 'signin'
                ? 'bg-[#D6BC86] text-[#0B0B0D] shadow-md'
                : 'text-[#77736D] hover:text-[#B6B0A5]'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-all ${mode === 'signup'
                ? 'bg-[#D6BC86] text-[#0B0B0D] shadow-md'
                : 'text-[#77736D] hover:text-[#B6B0A5]'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Google 1-Click Action */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#141418] hover:bg-[#1A1A22] border border-[rgba(214,188,134,0.22)] text-xs font-medium text-[#F5F1E8] flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.57 0 2.98.54 4.09 1.6l3.07-3.07C17.3 1.77 14.85 1 12 1 7.48 1 3.66 3.56 1.77 7.29l3.75 2.91C6.41 7.15 8.97 5 12 5z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.02 3.66-5 3.66-8.73z" />
              <path fill="#FBBC05" d="M5.52 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.77 6.8C.64 9.07 0 11.45 0 14s.64 4.93 1.77 7.2l3.75-2.91z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.76-2.91c-1.08.72-2.45 1.16-4.17 1.16-3.03 0-5.59-2.15-6.48-5.2l-3.75 2.91C3.66 20.44 7.48 23 12 23z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-[1px] bg-[rgba(214,188,134,0.12)]" />
            <span className="text-[10px] font-semibold text-[#77736D] uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-[1px] bg-[rgba(214,188,134,0.12)]" />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-[#D98282]/10 border border-[#D98282]/30 text-[#D98282] text-xs leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#B6B0A5]">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/60 placeholder:text-[#555]"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#B6B0A5]">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@wealthvault.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/60 placeholder:text-[#555]"
                />
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#B6B0A5]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-xs text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/60 placeholder:text-[#555]"
                />
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736D]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736D] hover:text-[#B6B0A5]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0B0B0D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Authenticate & Enter' : 'Create Cloud Vault'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footnote */}
          <p className="text-center text-[10px] text-[#77736D] leading-relaxed pt-1">
            By authenticating, your financial portfolio automatically syncs in real time with Firebase Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};
