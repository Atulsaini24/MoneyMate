import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Share2, Download, RotateCcw, ArrowDownRight, ArrowUpRight, Pause } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { buildRecap, type MonthRecap } from '@/lib/recap';
import { formatCurrency } from '@/lib/utils';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { confetti, haptic } from '@/lib/fx';
import { EXPENSE_CATEGORIES } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { renderShareCard } from './shareCard';

const SLIDE_MS = 6000;
const ease = [0.16, 1, 0.3, 1] as const;

// Each slide gets its own light so the story feels like it moves through rooms
const BACKDROPS = [
  'radial-gradient(120% 80% at 20% 10%, #3a2d14 0%, #0b0b0d 60%)',
  'radial-gradient(110% 90% at 80% 20%, #12301f 0%, #0b0b0d 62%)',
  'radial-gradient(120% 90% at 50% 0%, #3b2a12 0%, #0b0b0d 65%)',
  'radial-gradient(120% 90% at 10% 90%, #2c1a2e 0%, #0b0b0d 62%)',
  'radial-gradient(120% 90% at 90% 80%, #13283a 0%, #0b0b0d 62%)',
  'radial-gradient(120% 90% at 50% 100%, #33270f 0%, #0b0b0d 60%)',
  'radial-gradient(130% 100% at 50% 40%, #4a3815 0%, #0b0b0d 66%)',
  'radial-gradient(120% 90% at 50% 0%, #2a2214 0%, #0b0b0d 60%)',
];

const rise = (d = 0) => ({ initial: { opacity: 0, y: 28, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.9, delay: d, ease } });
const pct = (n: number) => `${Math.round(n * 100)}%`;

/* ---------------------------------------------------------------- slides */

const Intro: React.FC<{ r: MonthRecap }> = ({ r }) => (
  <div className="h-full flex flex-col justify-end pb-24 px-8">
    <motion.p {...rise(0.1)} className="text-sm tracking-wide text-[#E9D8AF]/80">Your month in money</motion.p>
    <h1 className="font-serif text-[clamp(3.5rem,16vw,6.5rem)] leading-[0.95] text-[#F5F1E8] mt-3" aria-label={r.monthName}>
      {r.monthName.split('').map((ch, i) => (
        <motion.span key={i} className="inline-block" initial={{ opacity: 0, y: 60, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.25 + i * 0.07, duration: 0.9, ease }}>{ch}</motion.span>
      ))}
    </h1>
    <motion.p {...rise(1.1)} className="text-lg text-[#B6B0A5] mt-5 max-w-xs leading-relaxed">
      {r.txCount} transactions. Here’s what they say about you.
    </motion.p>
  </div>
);

const Flow: React.FC<{ r: MonthRecap }> = ({ r }) => {
  const C = 2 * Math.PI * 70;
  const rate = Math.max(0, Math.min(1, r.savingsRate));
  return (
    <div className="h-full flex flex-col justify-center px-8 gap-7">
      {[
        { label: 'You earned', v: r.income, c: 'text-[#83C9A5]', d: 0.2 },
        { label: 'You spent', v: r.spent, c: 'text-[#F5F1E8]', d: 0.9 },
        { label: r.saved >= 0 ? 'You kept' : 'You overspent by', v: Math.abs(r.saved), c: r.saved >= 0 ? 'mm-gold-text' : 'text-[#E08C8C]', d: 1.6 },
      ].map(x => (
        <motion.div key={x.label} {...rise(x.d)}>
          <p className="text-sm text-[#B6B0A5]">{x.label}</p>
          <AnimatedNumber value={x.v} duration={1400} className={`block font-semibold tracking-tight number-display text-[clamp(2.4rem,11vw,3.6rem)] leading-tight ${x.c}`} />
        </motion.div>
      ))}
      {r.income > 0 && (
        <motion.div {...rise(2.3)} className="flex items-center gap-4 mt-2">
          <svg viewBox="0 0 160 160" className="w-20 h-20 -rotate-90">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(245,241,232,.1)" strokeWidth="12" />
            <motion.circle cx="80" cy="80" r="70" fill="none" stroke="#D6BC86" strokeWidth="12" strokeLinecap="round" strokeDasharray={C}
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - rate) }} transition={{ delay: 2.5, duration: 1.4, ease }} />
          </svg>
          <p className="text-[#F5F1E8] text-lg leading-snug">That’s a <b className="text-[#E9D8AF]">{pct(Math.max(0, r.savingsRate))}</b><br />savings rate.</p>
        </motion.div>
      )}
    </div>
  );
};

const TopCategory: React.FC<{ r: MonthRecap }> = ({ r }) => {
  if (!r.topCategory) return <Empty text="No spending recorded this month. That’s one way to save." />;
  const info = EXPENSE_CATEGORIES.find(c => c.name === r.topCategory!.name);
  const colors = ['#D6BC86', '#83C9A5', '#E08C8C', '#8FB3D9', '#B6A3D9', '#77736D'];
  const top5 = r.categories.slice(0, 5);
  return (
    <div className="h-full flex flex-col justify-center px-8">
      <motion.div initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 }}>
        <CategoryIcon name={info?.icon || 'Circle'} color={info?.color || '#D6BC86'} size={44} />
      </motion.div>
      <motion.p {...rise(0.5)} className="text-sm text-[#B6B0A5] mt-6">Where most of it went</motion.p>
      <motion.h2 {...rise(0.7)} className="font-serif text-[clamp(2.4rem,10vw,3.4rem)] text-[#F5F1E8] leading-tight">{r.topCategory.name}</motion.h2>
      <motion.p {...rise(1)} className="text-lg text-[#B6B0A5] mt-2">
        <b className="text-[#E9D8AF] text-2xl">{pct(r.topCategory.share)}</b> of your spending · {formatCurrency(r.topCategory.amount)}
      </motion.p>
      <div className="mt-8 h-3 rounded-full overflow-hidden flex bg-white/5">
        {top5.map((c, i) => (
          <motion.div key={c.name} style={{ background: colors[i] }} initial={{ width: 0 }} animate={{ width: `${(c.amount / r.spent) * 100}%` }}
            transition={{ delay: 1.3 + i * 0.15, duration: 0.8, ease }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {top5.map((c, i) => (
          <motion.p key={c.name} {...rise(1.6 + i * 0.1)} className="flex items-center gap-2 text-xs text-[#B6B0A5] truncate">
            <i className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i] }} /> {c.name}
          </motion.p>
        ))}
      </div>
    </div>
  );
};

const Merchant: React.FC<{ r: MonthRecap }> = ({ r }) => (
  <div className="h-full flex flex-col justify-center px-8">
    {r.topMerchant ? (
      <>
        <motion.p {...rise(0.2)} className="text-sm text-[#B6B0A5]">Your go-to</motion.p>
        <motion.h2 {...rise(0.4)} className="font-serif text-[clamp(2.4rem,11vw,3.8rem)] text-[#F5F1E8] leading-[1.05] break-words">{r.topMerchant.name}</motion.h2>
        <div className="flex gap-1.5 mt-6 flex-wrap max-w-xs" aria-hidden>
          {Array.from({ length: Math.min(r.topMerchant.count, 30) }).map((_, i) => (
            <motion.span key={i} className="w-3.5 h-3.5 rounded-full bg-[#D6BC86]"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 + i * 0.06, type: 'spring', stiffness: 500, damping: 15 }} />
          ))}
        </div>
        <motion.p {...rise(1.2)} className="text-lg text-[#B6B0A5] mt-4">
          <b className="text-[#F5F1E8]">{r.topMerchant.count} times</b> this month, {formatCurrency(r.topMerchant.amount)} in total.
        </motion.p>
      </>
    ) : (
      <motion.p {...rise(0.2)} className="text-2xl text-[#F5F1E8] font-serif">No single place got your money twice. Variety!</motion.p>
    )}
    {r.biggest && (
      <motion.div {...rise(2)} className="mt-10 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur">
        <p className="text-xs text-[#B6B0A5]">Biggest single purchase</p>
        <p className="text-[#F5F1E8] text-lg mt-1">{r.biggest.description} <span className="text-[#E9D8AF] number-display">· {formatCurrency(r.biggest.amount)}</span></p>
      </motion.div>
    )}
  </div>
);

const Rhythm: React.FC<{ r: MonthRecap }> = ({ r }) => {
  const max = Math.max(1, ...r.daily);
  const [y, m] = r.month.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  return (
    <div className="h-full flex flex-col justify-center px-8">
      <motion.p {...rise(0.1)} className="text-sm text-[#B6B0A5]">Your spending rhythm</motion.p>
      <div className="grid grid-cols-7 gap-1.5 mt-5 max-w-xs" aria-hidden>
        {Array.from({ length: lead }).map((_, i) => <span key={`l${i}`} />)}
        {r.daily.map((v, i) => {
          const future = i >= r.daysElapsed;
          return (
            <motion.span key={i} className="aspect-square rounded-md"
              style={{ background: future ? 'rgba(255,255,255,.03)' : v === 0 ? 'rgba(131,201,165,.55)' : `rgba(214,188,134,${0.15 + 0.85 * (v / max)})` }}
              initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.045, duration: 0.4, ease }} />
          );
        })}
      </div>
      <motion.p {...rise(1.9)} className="text-2xl text-[#F5F1E8] font-serif mt-8">
        <span className="text-[#83C9A5]">{r.noSpendDays} no-spend {r.noSpendDays === 1 ? 'day' : 'days'}</span>
      </motion.p>
      {r.busiestWeekday && (
        <motion.p {...rise(2.3)} className="text-lg text-[#B6B0A5] mt-2">Your wallet works hardest on <b className="text-[#E9D8AF]">{r.busiestWeekday}</b>.</motion.p>
      )}
    </div>
  );
};

const Compare: React.FC<{ r: MonthRecap }> = ({ r }) => {
  if (r.spendChange === null) return <Empty text="Next month we’ll show how you compare. Keep logging!" />;
  const down = r.spendChange <= 0;
  const Icon = down ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="h-full flex flex-col justify-center px-8">
      <motion.p {...rise(0.2)} className="text-sm text-[#B6B0A5]">Compared with last month</motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.5, y: down ? -40 : 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 12 }}
        className={`mt-6 w-24 h-24 rounded-3xl flex items-center justify-center ${down ? 'bg-[#83C9A5]/15 text-[#83C9A5]' : 'bg-[#E08C8C]/15 text-[#E08C8C]'}`}>
        <Icon size={52} strokeWidth={1.6} />
      </motion.div>
      <motion.h2 {...rise(0.9)} className="font-serif text-[clamp(2.6rem,12vw,4rem)] text-[#F5F1E8] leading-none mt-8">
        {pct(Math.abs(r.spendChange))} {down ? 'less' : 'more'}
      </motion.h2>
      <motion.p {...rise(1.3)} className="text-lg text-[#B6B0A5] mt-3 max-w-xs">
        {down ? 'You spent less than the month before. That’s momentum.' : 'Spending crept up. Your budgets can help rein it in.'}
      </motion.p>
    </div>
  );
};

const Persona: React.FC<{ r: MonthRecap }> = ({ r }) => {
  useEffect(() => {
    const t = setTimeout(() => { confetti({ y: innerHeight * 0.45, count: 160, spread: 1.4 }); haptic([20, 40, 30]); }, 1300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center" style={{ perspective: 900 }}>
      <motion.p {...rise(0.1)} className="text-sm text-[#B6B0A5]">This month, you were</motion.p>
      <motion.div initial={{ rotateY: 180, scale: 0.7, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 1.2, ease }}
        className="mt-6 w-full max-w-[290px] aspect-[3/4] rounded-[28px] p-6 flex flex-col items-center justify-center relative overflow-hidden border border-[#D6BC86]/40"
        style={{ background: 'linear-gradient(160deg, #2a2112 0%, #141416 55%, #1e1a10 100%)', boxShadow: '0 30px 80px -20px rgba(214,188,134,.35)' }}>
        <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(233,216,175,.18) 50%, transparent 70%)' }}
          initial={{ x: '-100%' }} animate={{ x: '120%' }} transition={{ delay: 1.6, duration: 1.4, ease: 'easeInOut' }} />
        <span className="text-7xl" role="img" aria-hidden>{r.persona.emoji}</span>
        <h2 className="font-serif text-4xl mm-gold-text mt-5 leading-tight">{r.persona.title}</h2>
        <p className="text-sm text-[#B6B0A5] mt-3 leading-relaxed">{r.persona.line}</p>
      </motion.div>
    </div>
  );
};

const ShareSlide: React.FC<{ r: MonthRecap; onReplay: () => void }> = ({ r, onReplay }) => {
  const [withAmounts, setWithAmounts] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    let alive = true;
    renderShareCard(r, { withAmounts }).then(blob => {
      if (!alive) return;
      blobRef.current = blob;
      setUrl(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
    });
    return () => { alive = false; };
  }, [r, withAmounts]);

  const file = () => new File([blobRef.current!], `moneymate-${r.month}.png`, { type: 'image/png' });
  const download = () => {
    const a = Object.assign(document.createElement('a'), { href: url!, download: `moneymate-${r.month}.png` });
    a.click();
  };
  const share = async () => {
    haptic(10);
    const f = file();
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: `My ${r.monthName} on MoneyMate` }); } catch { /* cancelled */ }
    } else download();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 gap-5" onClick={e => e.stopPropagation()}>
      <motion.div {...rise(0.1)} className="w-full max-w-[260px] aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111]">
        {url ? <img src={url} alt={`Shareable summary of ${r.label}`} className="w-full h-full object-cover" /> : <div className="w-full h-full mm-shimmer" />}
      </motion.div>
      <motion.label {...rise(0.3)} className="flex items-center gap-3 text-sm text-[#B6B0A5] cursor-pointer select-none">
        <button role="switch" aria-checked={withAmounts} onClick={() => setWithAmounts(v => !v)}
          className={`w-10 h-6 rounded-full p-0.5 transition-colors ${withAmounts ? 'bg-[#D6BC86]' : 'bg-white/15'}`}>
          <span className={`block w-5 h-5 rounded-full bg-[#0B0B0D] transition-transform ${withAmounts ? 'translate-x-4' : ''}`} />
        </button>
        Show amounts on the card
      </motion.label>
      <motion.div {...rise(0.45)} className="flex gap-2 w-full max-w-[300px]">
        <button onClick={share} disabled={!url} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#D6BC86] text-[#0B0B0D] font-semibold hover:bg-[#E9D8AF] active:scale-95 transition-all">
          <Share2 size={17} /> Share
        </button>
        <button onClick={download} disabled={!url} className="p-3 rounded-2xl bg-white/8 text-[#F5F1E8] hover:bg-white/15" aria-label="Download image"><Download size={18} /></button>
        <button onClick={onReplay} className="p-3 rounded-2xl bg-white/8 text-[#F5F1E8] hover:bg-white/15" aria-label="Watch again"><RotateCcw size={18} /></button>
      </motion.div>
    </div>
  );
};

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-full flex items-center px-8"><motion.p {...rise(0.2)} className="font-serif text-3xl text-[#F5F1E8] leading-snug">{text}</motion.p></div>
);

/* ------------------------------------------------------------ container */

export const RecapStory: React.FC = () => {
  const { recap, closeRecap } = useUI();
  const { transactions } = useApp();
  const r = useMemo(() => (recap ? buildRecap(transactions, recap) : null), [recap, transactions]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimer = useRef<number | undefined>(undefined);

  const slides = r ? [
    <Intro r={r} />, <Flow r={r} />, <TopCategory r={r} />, <Merchant r={r} />,
    <Rhythm r={r} />, <Compare r={r} />, <Persona r={r} />, <ShareSlide r={r} onReplay={() => setI(0)} />,
  ] : [];
  const last = slides.length - 1;

  const go = useCallback((d: number) => {
    setI(cur => Math.max(0, Math.min(last, cur + d)));
    setProgress(0);
    haptic(5);
  }, [last]);

  useEffect(() => { if (recap) { setI(0); setProgress(0); } }, [recap]);
  useEffect(() => { setProgress(0); }, [i]);

  // Story timer
  useEffect(() => {
    if (!recap || paused || i === last) return;
    let raf = 0, prev = performance.now();
    const tick = (t: number) => {
      setProgress(p => {
        const n = p + (t - prev) / SLIDE_MS;
        if (n >= 1) { setI(c => Math.min(last, c + 1)); return 0; }
        return n;
      });
      prev = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recap, paused, i, last]);

  useEffect(() => {
    if (!recap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') closeRecap();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [recap, go, closeRecap]);

  const onPointerDown = () => { holdTimer.current = window.setTimeout(() => setPaused(true), 180); };
  const onPointerUp = (e: React.PointerEvent) => {
    clearTimeout(holdTimer.current);
    if (paused) { setPaused(false); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1);
  };

  return createPortal(
    <AnimatePresence>
      {r && (
        <motion.div className="fixed inset-0 z-[3000] bg-black flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${r.label} recap`}>
          <motion.div className="relative w-full h-full sm:h-[min(92vh,860px)] sm:w-auto sm:aspect-[9/17] sm:rounded-[32px] overflow-hidden text-[#F5F1E8] select-none"
            initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }} transition={{ duration: 0.5, ease }}>
            {/* Backdrop crossfade */}
            <AnimatePresence>
              <motion.div key={i} className="absolute inset-0" style={{ background: BACKDROPS[i % BACKDROPS.length] }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
            </AnimatePresence>
            {(i === 0 || i === 6) && (
              <motion.div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 8 }}
                style={{ backgroundImage: `url(/assets/moneymate/hero/${i === 0 ? 'dashboard-hero' : 'night'}.jpg)` }} />
            )}
            <div className="mm-grain !absolute" aria-hidden />

            {/* Progress */}
            <div className="absolute top-0 inset-x-0 z-20 p-3 pt-[max(12px,env(safe-area-inset-top))] flex gap-1">
              {slides.map((_, k) => (
                <div key={k} className="h-[3px] flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: k < i ? '100%' : k === i ? `${(i === last ? 1 : progress) * 100}%` : '0%' }} />
                </div>
              ))}
            </div>
            <div className="absolute top-6 inset-x-0 z-20 px-4 pt-[env(safe-area-inset-top)] flex items-center justify-between">
              <span className="text-xs font-medium text-white/70">MoneyMate · {r.label}</span>
              <div className="flex items-center gap-1">
                {paused && <Pause size={14} className="text-white/70" />}
                <button onClick={closeRecap} className="p-2 rounded-full hover:bg-white/10" aria-label="Close recap"><X size={20} /></button>
              </div>
            </div>

            {/* Slide */}
            <div className="absolute inset-0 z-10" onPointerDown={i === last ? undefined : onPointerDown} onPointerUp={i === last ? undefined : onPointerUp}
              onPointerLeave={() => { clearTimeout(holdTimer.current); setPaused(false); }}>
              <AnimatePresence mode="wait">
                <motion.div key={i} className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease }}>
                  {slides[i]}
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="sr-only" aria-live="polite">Slide {i + 1} of {slides.length}. Use arrow keys to move.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default RecapStory;
