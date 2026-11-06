import React, { useState } from 'react';
import { Eye, EyeOff, MessageSquareText, ScanLine, CalendarClock, PiggyBank, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MoneyMateLogo, LogoMark } from '@/components/shared/MoneyMateLogo';
import { Guilloche } from '@/components/ui/Guilloche';
import { motion } from 'framer-motion';
import { MoneyCanvas } from '@/components/three/MoneyCanvas';
import { TiltCard } from '@/components/motion';
import { BrandTile } from '@/components/shared/MerchantLogo';
import { brandFor, PAYMENT_BRANDS } from '@/lib/merchants';

// Banks and UPI apps whose SMS the importer understands (see lib/importers/sms.ts)
const SMS_SOURCES = [brandFor('HDFC'), brandFor('ICICI'), brandFor('SBI'), brandFor('Axis'), brandFor('Kotak'), PAYMENT_BRANDS.phonepe, PAYMENT_BRANDS.paytm].filter(Boolean) as NonNullable<ReturnType<typeof brandFor>>[];
import { Button, Field, Input, Segmented } from '@/components/ui';

const FEATURES = [
  { icon: CalendarClock, title: 'A daily spending allowance', text: 'Worked out from your income and the bills still due this month.' },
  { icon: MessageSquareText, title: 'Bank SMS and statements', text: 'Paste messages or drop a PDF. Amounts, dates and shops are filled in for you.' },
  { icon: ScanLine, title: 'Receipts and voice', text: 'Snap a bill or say “450 on groceries”. You check it before it’s saved.' },
  { icon: PiggyBank, title: 'Budgets, goals and splits', text: 'Plus IOUs, group trips, net worth and an Indian tax planner.' },
];

const friendlyError = (e: any): string => {
  const code: string = e?.code || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return 'That email and password don’t match. Try again, or reset your password.';
  if (code.includes('email-already-in-use')) return 'There’s already an account with this email. Sign in instead.';
  if (code.includes('weak-password')) return 'Use at least 6 characters for your password.';
  if (code.includes('invalid-email')) return 'That email address doesn’t look right.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute, then try again.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return '';
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.';
  if (code.includes('network')) return 'You seem to be offline. Check your connection.';
  return e?.message?.replace('Firebase: ', '') || 'Something went wrong. Try again.';
};

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, isConfigured, continueAsGuest } = useAuth();
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
    if (mode === 'reset') return run('email', async () => { await resetPassword(email.trim()); setNotice(`We’ve emailed a reset link to ${email.trim()}.`); });
    run('email', () => (mode === 'signup' ? signUpWithEmail(email.trim(), password, name) : signInWithEmail(email.trim(), password)));
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] bg-mm-bg">
      {/* Story */}
      <section className="hidden lg:flex note-panel !rounded-none flex-col p-12 xl:p-16 h-dvh sticky top-0">
        <Guilloche className="guilloche-draw absolute inset-0 w-full h-full text-[var(--color-mm-note-text)] opacity-[0.06] -z-10" lines={26} />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative flex items-center gap-3">
          <LogoMark size={36} className="rounded-[10px] ring-1 ring-white/20" /><span className="font-display text-xl font-semibold">MoneyMate</span>
        </motion.div>
        <div className="relative max-w-xl mt-10">
          <h1 className="font-display text-[3.25rem] xl:text-[3.75rem] leading-[1.02] font-semibold tracking-[-0.03em]" aria-label="Know what’s safe to spend today.">
            {'Know what’s safe to spend today.'.split(' ').map((w, i) => (
              <motion.span key={i} aria-hidden className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: '0.5em', filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>{w}</motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} className="text-lg text-[var(--color-mm-note-muted)] mt-5 leading-relaxed max-w-md">
            A calm place for your money: what came in, what went out, and what you can still spend without missing a bill.
          </motion.p>
        </div>
        <MoneyCanvas mode="hero" interactive={false} className="relative flex-1 min-h-[200px] -mx-12 xl:-mx-16 my-2" />
        <motion.ul className="relative grid grid-cols-2 gap-x-8 gap-y-5 max-w-2xl" initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } }}>
          {FEATURES.map(f => (
            <motion.li key={f.title} className="flex gap-3.5" variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } } }}>
              <span className="w-10 h-10 rounded-xl bg-white/8 backdrop-blur text-[var(--color-mm-marigold)] flex items-center justify-center shrink-0"><f.icon size={19} /></span>
              <span>
                <span className="block font-semibold">{f.title}</span>
                <span className="block text-sm text-[var(--color-mm-note-muted)] mt-0.5 leading-snug">{f.text}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
        <p className="relative text-sm text-[var(--color-mm-note-muted)] flex items-center gap-2 mt-8"><Lock size={14} />Bank SMS, statements and PDFs are read on your device.</p>
      </section>

      {/* Form */}
      <section className="flex flex-col px-5 sm:px-10 py-8 sm:py-12 pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="lg:hidden"><MoneyMateLogo size={32} /></div>
        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          <div className="lg:hidden mb-8">
            <TiltCard max={8} className="-mx-1 mb-7 rounded-[28px]">
              <div className="note-panel !rounded-[28px] h-64 shadow-[0_30px_60px_-30px_rgb(15_58_54/0.7)]">
                <Guilloche className="guilloche-draw absolute inset-0 w-full h-full text-[var(--color-mm-note-text)] opacity-[0.08] -z-10" />
                <MoneyCanvas mode="hero" interactive={false} className="absolute inset-0" />
              </div>
            </TiltCard>
            <h1 className="font-display text-[2.4rem] leading-[1.04] font-semibold tracking-[-0.025em] text-mm-text" aria-label="Know what’s safe to spend today.">
              {'Know what’s safe to spend today.'.split(' ').map((w, i) => (
                <motion.span key={i} aria-hidden className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: '0.5em', filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>{w}</motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="text-[15px] text-mm-text2 mt-3 leading-relaxed">Track spending, import bank SMS, set budgets and save for goals.</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.5 }} className="flex items-center gap-3 mt-5">
              <div className="flex -space-x-2">
                {SMS_SOURCES.map((b, i) => (
                  <motion.span key={b.name} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1 + i * 0.05, type: 'spring', stiffness: 500, damping: 22 }}
                    className="rounded-full ring-2 ring-mm-bg"><BrandTile brand={b} px={30} className="rounded-full" /></motion.span>
                ))}
              </div>
              <p className="text-[12.5px] text-mm-muted leading-snug">Reads SMS from your bank and UPI apps</p>
            </motion.div>
          </div>

          {isConfigured ? (
            <>
              <h2 className="text-2xl font-semibold text-mm-text">
                {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}
              </h2>
              <p className="text-[15px] text-mm-text2 mt-1.5">
                {mode === 'signup' ? 'Free. Your data syncs across your devices.' : mode === 'reset' ? 'We’ll email you a link to choose a new one.' : 'Sign in to pick up where you left off.'}
              </p>

              {mode !== 'reset' && (
                <>
                  <Segmented label="Sign in or create an account" value={mode} onChange={m => { setMode(m); setError(''); }} className="w-full mt-6"
                    options={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]} />
                  <Button variant="secondary" size="lg" className="w-full mt-4" onClick={() => run('google', signInWithGoogle)} disabled={!!busy} loading={busy === 'google'}>
                    {busy !== 'google' && <GoogleMark />} Continue with Google
                  </Button>
                  <div className="flex items-center gap-3 my-5 text-[13px] text-mm-muted"><span className="flex-1 h-px bg-mm-line/10" />or with email<span className="flex-1 h-px bg-mm-line/10" /></div>
                </>
              )}

              <form onSubmit={submit} className={`space-y-4 ${mode === 'reset' ? 'mt-6' : ''}`}>
                {mode === 'signup' && (
                  <Field label="Your name" htmlFor="l-name"><Input id="l-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></Field>
                )}
                <Field label="Email" htmlFor="l-email"><Input id="l-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></Field>
                {mode !== 'reset' && (
                  <Field label="Password" htmlFor="l-pass">
                    <div className="relative">
                      <Input id="l-pass" type={show ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="pr-11"
                        placeholder={mode === 'signup' ? 'At least 6 characters' : undefined} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-mm-muted hover:text-mm-text" aria-label={show ? 'Hide password' : 'Show password'}>
                        {show ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </Field>
                )}
                {mode === 'signin' && (
                  <div className="flex justify-end -mt-1">
                    <button type="button" onClick={() => { setMode('reset'); setError(''); }} className="text-[13px] font-semibold text-mm-accent hover:underline underline-offset-4">Forgot password?</button>
                  </div>
                )}
                {(error || notice) && (
                  <p role="alert" className={`text-sm p-3 rounded-xl ${error ? 'text-mm-negative bg-mm-negative/10' : 'text-mm-positive bg-mm-positive/10'}`}>{error || notice}</p>
                )}
                <Button type="submit" size="lg" className="w-full" loading={busy === 'email'} disabled={!!busy}>
                  {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
                </Button>
                {mode === 'reset' && <Button variant="ghost" className="w-full" onClick={() => { setMode('signin'); setError(''); setNotice(''); }}>Back to sign in</Button>}
              </form>

              <div className="mt-8 pt-6 border-t border-mm-line/8">
                <Button variant="ghost" className="w-full" onClick={continueAsGuest}>Use without an account <ArrowRight size={16} /></Button>
                <p className="text-[13px] text-mm-muted text-center mt-2">Data stays in this browser. You can sign in later and bring it with you.</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-mm-text">Get started</h2>
              <p className="text-[15px] text-mm-text2 mt-1.5 leading-relaxed">Everything you add is kept in this browser. Download a backup from Settings now and then.</p>
              <Button size="lg" className="w-full mt-6" onClick={continueAsGuest}>Start using MoneyMate <ArrowRight size={17} /></Button>
              <p className="text-[13px] text-mm-muted mt-4 leading-relaxed">Accounts and sync aren’t turned on for this installation. Whoever runs it can enable them by adding Firebase keys (see <code className="text-mm-text2">.env.example</code>).</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
