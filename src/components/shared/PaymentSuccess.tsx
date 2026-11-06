import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { useCelebration, type Celebration } from '@/lib/celebrate';
import { playSuccess, playCoin } from '@/lib/sound';
import { confetti, haptic } from '@/lib/fx';
import { formatCurrency } from '@/lib/utils';
import { RollingNumber } from '@/components/motion';
import { BrandTile } from '@/components/shared/MerchantLogo';
import { ICONS } from '@/components/shared/CategoryIcon';
import { brandFor } from '@/lib/merchants';

const HEADLINE: Record<Celebration['kind'], string> = {
  paid: 'Payment saved',
  received: 'Money received',
  transferred: 'Transfer saved',
  saved: 'Added to your goal',
  settled: 'Payment recorded',
};
const PREPOSITION: Record<Celebration['kind'], string> = {
  paid: 'Paid to', received: 'Received from', transferred: 'Moved to', saved: 'Saved in', settled: 'Settled with',
};

const AUTO_CLOSE_MS = 5200;

// Where the last tap landed, so the green grows out of the button you pressed.
let lastTap = { x: 0, y: 0, at: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', e => { lastTap = { x: e.clientX, y: e.clientY, at: Date.now() }; }, { capture: true, passive: true });
}

export const PaymentSuccess: React.FC = () => {
  const [current, clear] = useCelebration();
  return createPortal(
    <AnimatePresence>{current && <SuccessScreen key={current.id} c={current} onClose={clear} />}</AnimatePresence>,
    document.body,
  );
};

const SuccessScreen: React.FC<{ c: Celebration; onClose: () => void }> = ({ c, onClose }) => {
  const reduce = useReducedMotion();
  const doneRef = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);
  const origin = useMemo(() => {
    const fresh = Date.now() - lastTap.at < 1500;
    return fresh ? { x: lastTap.x, y: lastTap.y } : { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  }, []);
  const when = useMemo(() => new Date(), []);
  const ref = useMemo(() => `MM${Date.now().toString(36).toUpperCase().slice(-8)}`, []);

  // Sound, haptics and status-bar colour, timed to the tick landing
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const prev = meta?.getAttribute('content');
    meta?.setAttribute('content', '#0A6B43');
    const t = setTimeout(() => {
      if (c.kind === 'saved') playCoin(); else playSuccess();
      haptic([14, 50, 28]);
      if (c.milestone) confetti({ y: window.innerHeight * 0.32, count: 160 });
    }, reduce ? 0 : 380);
    const f = setTimeout(() => doneRef.current?.focus({ preventScroll: true }), 700);
    return () => { clearTimeout(t); clearTimeout(f); if (prev) meta?.setAttribute('content', prev); };
  }, [c, reduce]);

  // Close by itself after a few seconds, unless the person is touching the screen
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [paused, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const share = async () => {
    setPaused(true);
    const text = `${HEADLINE[c.kind]}: ${formatCurrency(c.amount, { reveal: true })} · ${PREPOSITION[c.kind].toLowerCase()} ${c.title} · ${when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · Ref ${ref}`;
    try {
      if (navigator.share) await navigator.share({ title: 'MoneyMate', text });
      else await navigator.clipboard?.writeText(text);
    } catch { /* cancelled */ }
  };

  const R = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y)) + 40;
  const amountText = formatCurrency(c.amount);

  return (
    <motion.div
      role="alertdialog" aria-modal="true" aria-labelledby="mm-success-title" aria-describedby="mm-success-desc"
      className="fixed inset-0 z-[4000] overflow-hidden text-white select-none"
      onPointerDown={() => setPaused(true)}
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}
    >
      {/* The green flood, growing out of the tap */}
      <motion.div className="absolute inset-0 mm-success-bg"
        initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
        animate={reduce ? { opacity: 1 } : { clipPath: `circle(${R}px at ${origin.x}px ${origin.y}px)` }}
        transition={{ duration: 0.62, ease: [0.65, 0, 0.35, 1] }} />

      {/* Slow rotating engraving, like the rosette on a banknote */}
      <motion.svg aria-hidden viewBox="-200 -200 400 400" className="absolute left-1/2 top-[34%] w-[160vmin] h-[160vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.10] pointer-events-none"
        initial={{ opacity: 0, rotate: -20, scale: 0.8 }} animate={{ opacity: 0.1, rotate: 0, scale: 1 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}>
        {Array.from({ length: 28 }, (_, k) => (
          <ellipse key={k} cx="0" cy="0" rx={190 - k * 2} ry={70 + k * 3} fill="none" stroke="white" strokeWidth="0.6" transform={`rotate(${k * (180 / 28)})`} />
        ))}
      </motion.svg>

      <div className="relative h-full flex flex-col items-center sm:justify-center px-6 pt-[max(12vh,calc(env(safe-area-inset-top)+48px))] sm:pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <TickCoin reduce={Boolean(reduce)} />

        <motion.div className="mt-9 text-center" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h2 id="mm-success-title" className="text-[17px] font-sans font-semibold tracking-normal text-white/85">{HEADLINE[c.kind]}</h2>
          <div className="mt-2 amount font-semibold text-[3.4rem] sm:text-[4rem] leading-none drop-shadow-[0_8px_30px_rgb(0_0_0/0.25)]">
            <RollingNumber text={amountText} />
          </div>
        </motion.div>

        <motion.div id="mm-success-desc" className="mt-7 w-full max-w-sm rounded-[22px] bg-white/[0.11] backdrop-blur-md ring-1 ring-white/15 p-4"
          initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: reduce ? 0 : 0.72, type: 'spring', stiffness: 260, damping: 26 }}>
          <div className="flex items-center gap-3">
            <SubjectTile c={c} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-white/70">{PREPOSITION[c.kind]}</p>
              <p className="text-[17px] font-semibold truncate">{c.title}</p>
            </div>
          </div>
          <dl className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 gap-y-2 text-[13px]">
            {c.detail && <><dt className="text-white/65">Details</dt><dd className="text-right font-medium truncate">{c.detail}</dd></>}
            <dt className="text-white/65">When</dt>
            <dd className="text-right font-medium tabular">{when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</dd>
            <dt className="text-white/65">Reference</dt>
            <dd className="text-right font-medium tabular tracking-wide">{ref}</dd>
          </dl>
        </motion.div>

        <motion.div className="mt-auto sm:mt-8 w-full max-w-sm flex gap-2.5 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.9, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <button onClick={share} className="h-13 w-13 shrink-0 rounded-2xl bg-white/14 ring-1 ring-white/20 flex items-center justify-center active:scale-95 transition-transform" aria-label="Share receipt">
            <Share2 size={20} />
          </button>
          <button ref={doneRef} onClick={onClose}
            className="relative flex-1 h-13 rounded-2xl bg-white text-[#08522F] text-[16px] font-bold overflow-hidden active:scale-[0.98] transition-transform focus-visible:outline-white">
            {/* Countdown to the screen closing itself */}
            {!paused && !reduce && (
              <motion.span aria-hidden className="absolute inset-y-0 left-0 bg-[#0A6B43]/10" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: AUTO_CLOSE_MS / 1000, ease: 'linear' }} />
            )}
            <span className="relative">Done</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

/** The white coin with a tick: flips in like a coin landing, then rings outwards. */
const TickCoin: React.FC<{ reduce: boolean }> = ({ reduce }) => {
  const sparks = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + (i % 2 ? 0.12 : 0);
    const d = 92 + (i % 3) * 22;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: i % 4 === 0 ? 7 : i % 2 ? 4 : 5, gold: i % 3 === 0 };
  }), []);
  return (
    <div className="relative w-[124px] h-[124px]" style={{ perspective: 700 }} aria-hidden>
      {!reduce && [0, 1, 2].map(i => (
        <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-white/40"
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.9, 2.3], opacity: [0.55, 0] }}
          transition={{ delay: 0.42 + i * 0.32, duration: 1.6, ease: 'easeOut', repeat: 1, repeatDelay: 0.4 }} />
      ))}
      {!reduce && sparks.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2, background: p.gold ? '#F5C451' : '#FFFFFF' }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }} animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1.2, 0.4] }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      ))}
      <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
        initial={reduce ? false : { rotateY: -540, scale: 0.2, y: -40, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.85, ease: [0.2, 1.2, 0.4, 1] }}>
        {/* Coin edge: stacked layers give it thickness while it spins */}
        {[6, 4, 2].map(z => <span key={z} className="absolute inset-0 rounded-full bg-[#DCEFE5]" style={{ transform: `translateZ(-${z}px)` }} />)}
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#FFFFFF_0%,#F3FBF6_45%,#D2EBDD_100%)] shadow-[0_24px_50px_-12px_rgb(0_0_0/0.45),inset_0_-6px_14px_rgb(10_107_67/0.18),inset_0_4px_8px_rgb(255_255_255/0.9)]" />
        <svg viewBox="0 0 124 124" className="absolute inset-0">
          <circle cx="62" cy="62" r="50" fill="none" stroke="#0A6B43" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="2 4" />
          <motion.path d="M38 64 L55 80 L88 45" fill="none" stroke="#0A8A54" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.62, duration: 0.42, ease: [0.65, 0, 0.35, 1] }} />
        </svg>
      </motion.div>
    </div>
  );
};

/** Brand logo when we know the merchant, otherwise the category glyph on a white tile. */
const SubjectTile: React.FC<{ c: Celebration }> = ({ c }) => {
  const brand = brandFor(c.merchant || c.title);
  if (brand) return <span className="rounded-xl ring-2 ring-white/25"><BrandTile brand={brand} size="md" /></span>;
  const Icon = ICONS[c.icon || 'Wallet'] || ICONS.Wallet;
  return (
    <span aria-hidden className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-8px_rgb(0_0_0/0.5)]" style={{ color: c.color || '#0A6B43' }}>
      <Icon size={20} strokeWidth={2.1} />
    </span>
  );
};
