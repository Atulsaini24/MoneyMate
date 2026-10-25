import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, User, ScanLine, MessageSquareText, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

/* ---------------------------------------------------------- live showcase */

const FEED = [
  { icon: Sparkles, tone: '#D6BC86', title: 'Swiggy · ₹340', body: 'Sorted into Food & Dining automatically' },
  { icon: CheckCircle2, tone: '#83C9A5', title: 'On pace to save ₹18,400', body: '23% of income this month' },
  { icon: ScanLine, tone: '#E9D8AF', title: 'Receipt scanned', body: 'Blue Tokai Coffee · ₹420 · today' },
  { icon: MessageSquareText, tone: '#8FB3D9', title: 'Netflix due tomorrow', body: 'Usually ₹649, from 6 past payments' },
];

const LiveFeed: React.FC = () => {
  const [k, setK] = useState(0);
  useEffect(() => { const t = setInterval(() => setK(v => (v + 1) % FEED.length), 2600); return () => clearInterval(t); }, []);
  const item = FEED[k];
  return (
    <div className="h-[68px] relative">
      <AnimatePresence mode="popLayout">
        <motion.div key={k} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="absolute inset-0 flex items-center gap-3 px-4 rounded-2xl bg-[#17171B]/90 backdrop-blur-xl border border-[#D6BC86]/20 shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.tone}22`, color: item.tone }}>
            <item.icon size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[#F5F1E8] truncate">{item.title}</span>
            <span className="block text-xs text-[#B6B0A5] truncate">{item.body}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/** A raw bank SMS that turns into a clean transaction, on a loop. */
const SmsMorph: React.FC = () => {
  const [clean, setClean] = useState(false);
  useEffect(() => { const t = setInterval(() => setClean(c => !c), 3200); return () => clearInterval(t); }, []);
  return (
    <div className="relative h-[86px] rounded-2xl bg-[#121215]/90 border border-[#D6BC86]/15 overflow-hidden backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {!clean ? (
          <motion.p key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.96 }} transition={{ duration: 0.5 }}
            className="p-3.5 font-mono text-[10.5px] leading-relaxed text-[#8C877E]">
            Dear UPI user A/C X1234 debited by 250.00 on date 24Oct26 trf to SWIGGY Refno 4298123…
          </motion.p>
        ) : (
          <motion.div key="clean" initial={{ opacity: 0, filter: 'blur(6px)', scale: 1.04 }} animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center gap-3 px-4">
            <span className="w-10 h-10 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] flex items-center justify-center text-lg">🍜</span>
            <span className="flex-1">
              <span className="block text-sm text-[#F5F1E8] font-medium">Swiggy</span>
              <span className="block text-xs text-[#B6B0A5]">Food & Dining · UPI · 24 Oct</span>
            </span>
            <span className="text-sm text-[#F5F1E8] font-medium">−₹250</span>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.span className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#D6BC86]/25 to-transparent" animate={{ x: ['-20%', '700%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
};

const PulseMini: React.FC = () => {
  const C = 2 * Math.PI * 34;
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const s = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - s) / 1800); setN(Math.round(1240 * (1 - Math.pow(1 - p, 4)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="rounded-[22px] p-5 bg-gradient-to-br from-[#1E1B14] to-[#121215] border border-[#D6BC86]/25 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] flex items-center gap-5">
      <div className="relative w-[84px] h-[84px] shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(245,241,232,.08)" strokeWidth="6" />
          <motion.circle cx="40" cy="40" r="34" fill="none" stroke="#83C9A5" strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
            initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * 0.14 }} transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-[#F5F1E8]">86</span>
      </div>
      <div>
        <p className="text-xs text-[#B6B0A5]">Safe to spend today</p>
        <p className="text-3xl font-semibold text-[#F5F1E8] tracking-tight tabular-nums">₹{n.toLocaleString('en-IN')}</p>
        <p className="text-xs text-[#83C9A5] mt-1">Financial health: Excellent</p>
      </div>
    </div>
  );
};

const Showcase: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 18 });
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }} className="relative w-full" style={{ perspective: 1200 }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative w-full max-w-[400px] mx-auto lg:mx-0 space-y-3">
        <motion.div style={{ translateZ: 60 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <PulseMini />
        </motion.div>
        <motion.div style={{ translateZ: 100 }} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 24 }} transition={{ delay: 0.7, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <LiveFeed />
        </motion.div>
        <motion.div style={{ translateZ: 40 }} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: -16 }} transition={{ delay: 1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <SmsMorph />
        </motion.div>
      </motion.div>
    </div>
  );
};

/* --------------------------------------------------------------- the form */

const friendlyError = (e: any): string => {
  const code: string = e?.code || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return 'That email and password don’t match. Try again or reset your password.';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists. Sign in instead.';
  if (code.includes('weak-password')) return 'Use at least 6 characters for your password.';
  if (code.includes('invalid-email')) return 'That email address doesn’t look right.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute, then try again.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return '';
  if (code.includes('network')) return 'You seem to be offline. Check your connection.';
  return e?.message?.replace('Firebase: ', '') || 'Something went wrong. Try again.';
};

const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType; label: string; trailing?: React.ReactNode }> = ({ icon: Icon, label, trailing, ...props }) => (
  <label className="block">
    <span className="block text-xs font-medium text-mm-text2 mb-1.5">{label}</span>
    <span className="group flex items-center gap-2.5 px-3.5 rounded-xl bg-mm-bg2 border border-mm-line/15 focus-within:border-mm-gold/70 focus-within:ring-4 focus-within:ring-mm-gold/10 transition-all">
      <Icon size={16} className="text-mm-muted group-focus-within:text-mm-gold transition-colors shrink-0" />
      <input {...props} className="flex-1 min-w-0 bg-transparent py-3 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus-visible:outline-none" />
      {trailing}
    </span>
  </label>
);

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (kind: 'google' | 'email', fn: () => Promise<void>) => {
    setError(''); setNotice(''); setBusy(kind);
    try { await fn(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(null); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      return run('email', async () => { await resetPassword(email.trim()); setNotice(`Reset link sent to ${email.trim()}. Check your inbox.`); });
    }
    run('email', () => (mode === 'signup' ? signUpWithEmail(email.trim(), password, name) : signInWithEmail(email.trim(), password)));
  };

  return (
    <div className="min-h-screen bg-mm-bg text-mm-text grid lg:grid-cols-[1.15fr_1fr] relative overflow-hidden">
      {/* ---------- Showcase ---------- */}
      <section className="relative overflow-hidden px-6 sm:px-10 lg:px-14 pt-8 pb-10 lg:py-12 flex flex-col">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/assets/moneymate/hero/dashboard-hero.jpg)' }}
          initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: 'easeOut' }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0D]/95 via-[#0B0B0D]/85 to-[#0B0B0D]/60" aria-hidden />
        <div className="mm-ambient" aria-hidden><i /><i /><i /></div>

        <div className="relative z-10"><MoneyMateLogo size={36} /></div>

        <div className="relative z-10 flex-1 flex flex-col justify-center gap-10 lg:gap-14 mt-10 lg:mt-0">
          <div className="max-w-xl">
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[1.02] tracking-tight text-[#F5F1E8]">
              Know what’s safe to spend. Every single day.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}
              className="mt-5 text-base sm:text-lg text-[#B6B0A5] leading-relaxed max-w-md">
              Paste your bank SMS, snap a receipt, and MoneyMate does the bookkeeping. You just get the answers.
            </motion.p>
          </div>
          <div className="hidden sm:block"><Showcase /></div>
        </div>

        <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="relative z-10 hidden lg:flex gap-8 mt-10 text-sm text-[#B6B0A5]">
          {['Bank SMS & statement import', 'AI receipt scanning', 'Monthly Wrapped recap'].map(t => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#D6BC86]" /> {t}</li>
          ))}
        </motion.ul>
      </section>

      {/* ---------- Auth ---------- */}
      <section className="relative z-10 flex items-center justify-center px-6 py-10 sm:py-14 bg-mm-bg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]">
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}
          </h2>
          <p className="text-sm text-mm-text2 mt-1.5">
            {mode === 'signup' ? 'Free, private, and synced across your devices.' : mode === 'reset' ? 'We’ll email you a link to choose a new one.' : 'Sign in to pick up where you left off.'}
          </p>

          {!isConfigured && (
            <div className="mt-5 p-3.5 rounded-xl bg-mm-warning/10 border border-mm-warning/30 text-xs text-mm-text2 leading-relaxed">
              Sign-in isn’t set up yet. Add your Firebase keys to <code className="text-mm-text">.env</code> (see <code className="text-mm-text">.env.example</code>) and restart.
            </div>
          )}

          {mode !== 'reset' && (
            <>
              <div role="tablist" className="relative grid grid-cols-2 p-1 mt-6 rounded-xl bg-mm-bg2 border border-mm-line/12">
                {(['signin', 'signup'] as const).map(m => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
                    className={`relative z-10 py-2 text-sm font-medium rounded-lg transition-colors ${mode === m ? 'text-mm-text' : 'text-mm-muted hover:text-mm-text2'}`}>
                    {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-lg bg-mm-card border border-mm-line/20 shadow-sm" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <button onClick={() => run('google', signInWithGoogle)} disabled={!!busy || !isConfigured}
                className="mt-5 w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-mm-card border border-mm-line/20 text-sm font-medium hover:border-mm-gold/50 hover:bg-mm-elevated active:scale-[0.99] transition-all disabled:opacity-50">
                {busy === 'google' ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />} Continue with Google
              </button>

              <div className="flex items-center gap-3 my-5 text-xs text-mm-muted"><span className="flex-1 h-px bg-mm-line/15" />or with email<span className="flex-1 h-px bg-mm-line/15" /></div>
            </>
          )}

          <form onSubmit={submit} className={`space-y-3.5 ${mode === 'reset' ? 'mt-6' : ''}`}>
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <Field icon={User} label="Your name" value={name} onChange={e => setName(e.target.value)} placeholder="Atul Saini" autoComplete="name" />
                </motion.div>
              )}
            </AnimatePresence>
            <Field icon={Mail} label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            {mode !== 'reset' && (
              <Field icon={Lock} label="Password" type={show ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                trailing={
                  <button type="button" onClick={() => setShow(s => !s)} className="p-1 text-mm-muted hover:text-mm-text" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                } />
            )}

            {mode === 'signin' && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => { setMode('reset'); setError(''); }} className="text-xs text-mm-gold hover:text-mm-gold-light">Forgot password?</button>
              </div>
            )}

            <AnimatePresence>
              {(error || notice) && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert"
                  className={`text-sm p-3 rounded-xl ${error ? 'text-mm-negative bg-mm-negative/10' : 'text-mm-positive bg-mm-positive/10'}`}>
                  {error || notice}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={!!busy || !isConfigured}
              className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-mm-gold text-mm-on-gold text-sm font-semibold hover:bg-mm-gold-light active:scale-[0.99] transition-all disabled:opacity-50 relative overflow-hidden">
              <span className="absolute inset-0 mm-shimmer opacity-60" aria-hidden />
              {busy === 'email' && <Loader2 size={17} className="animate-spin relative" />}
              <span className="relative">{mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</span>
              {!busy && <ArrowRight size={16} className="relative group-hover:translate-x-0.5 transition-transform" />}
            </button>

            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('signin'); setError(''); setNotice(''); }} className="w-full text-sm text-mm-text2 hover:text-mm-text">Back to sign in</button>
            )}
          </form>

          <p className="text-xs text-mm-muted mt-8 leading-relaxed">
            Your data is private to your account. Bank SMS and receipts are only read when you choose to import them.
          </p>
        </motion.div>
      </section>
    </div>
  );
};
