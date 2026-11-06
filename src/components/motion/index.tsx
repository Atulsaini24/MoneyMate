import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------- stagger */

export const EASE = [0.16, 1, 0.3, 1] as const;

export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 } },
};

/** Children appear one after another on mount. */
export const Stagger: React.FC<{ children: React.ReactNode; className?: string; stagger?: number; delay?: number; as?: 'div' | 'ul' | 'ol' }> = ({ children, className, stagger, delay, as = 'div' }) => {
  const M = motion[as] as typeof motion.div;
  return <M className={className} variants={staggerContainer(stagger, delay)} initial="hidden" animate="show">{children}</M>;
};
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string; as?: 'div' | 'li' }> = ({ children, className, as = 'div' }) => {
  const M = motion[as] as typeof motion.div;
  return <M className={className} variants={riseItem}>{children}</M>;
};

/* ---------------------------------------------------------------- tilt */

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const canGyro = () => typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && !finePointer();
type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Leans in 3D with a soft light that moves across it: towards the cursor on
 * desktop, and with the phone's gyroscope on phones (tilt the phone, the card
 * tilts back). iOS asks for motion permission on the first tap.
 */
export const TiltCard: React.FC<{ children: React.ReactNode; className?: string; max?: number; glare?: boolean }> = ({ children, className, max = 6, glare = true }) => {
  const reduce = useReducedMotion();
  const mouse = !reduce && finePointer();
  const gyro = !reduce && canGyro();
  const px = useMotionValue(0.5), py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  const glareBg = useTransform([px, py], ([x, y]) => `radial-gradient(520px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgb(255 255 255 / ${gyro ? 0.16 : 0.22}), transparent 45%)`);

  useEffect(() => {
    if (!gyro) return;
    let base: number | null = null;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // Calibrate to however the phone is being held, and drift back slowly
      base = base == null ? e.beta : base + (e.beta - base) * 0.01;
      px.set(clamp(0.5 + e.gamma / 50));
      py.set(clamp(0.5 + (e.beta - base) / 40));
    };
    const D = DeviceOrientationEvent as IOSOrientation;
    let ask: (() => void) | null = null;
    if (typeof D.requestPermission === 'function') {
      ask = () => { D.requestPermission!().then(r => { if (r === 'granted') window.addEventListener('deviceorientation', on); }).catch(() => {}); };
      window.addEventListener('touchend', ask, { once: true });
    } else {
      window.addEventListener('deviceorientation', on);
    }
    return () => { window.removeEventListener('deviceorientation', on); if (ask) window.removeEventListener('touchend', ask); };
  }, [gyro, px, py]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouse) return;
    // Hold still over anything clickable, so a target never slides away under the cursor
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [role="button"]')) { px.set(0.5); py.set(0.5); return; }
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { if (mouse) { px.set(0.5); py.set(0.5); } };
  if (!mouse && !gyro) return <div className={className}>{children}</div>;
  return (
    <div style={{ perspective: 1100 }} className={cn('group/tilt', className)} onPointerMove={onMove} onPointerLeave={reset}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative h-full will-change-transform">
        {children}
        {glare && (
          <motion.span aria-hidden className={cn('pointer-events-none absolute inset-0 rounded-[24px] transition-opacity duration-300', gyro ? 'opacity-100' : 'opacity-0 group-hover/tilt:opacity-100')}
            style={{ background: glareBg }} />
        )}
      </motion.div>
    </div>
  );
};

/* ------------------------------------------------------- rolling number */

/** Each digit rolls like an odometer when the value changes. */
export const RollingNumber: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const reduce = useReducedMotion();
  const chars = text.split('');
  const digitsFromRight = chars.map((_, i) => chars.slice(i + 1).filter(c => /\d/.test(c)).length);
  return (
    <span className={cn('inline-flex items-baseline tabular', className)} aria-label={text} role="text">
      {chars.map((ch, i) => /\d/.test(ch) ? (
        <span key={`d${digitsFromRight[i]}`} aria-hidden className="relative inline-block overflow-hidden h-[1em] leading-none" style={{ width: '0.62em' }}>
          <motion.span className="absolute left-0 top-0 flex flex-col"
            initial={reduce ? false : { y: '0em' }} animate={{ y: `${-Number(ch)}em` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 1, delay: reduce ? 0 : digitsFromRight[i] * 0.04 }}>
            {'0123456789'.split('').map(d => <span key={d} className="h-[1em] leading-none text-center w-[0.62em]">{d}</span>)}
          </motion.span>
        </span>
      ) : <span key={`c${i}-${ch}`} aria-hidden className="leading-none">{ch}</span>)}
    </span>
  );
};

/* ------------------------------------------------------------ spotlight */

/** One pointer listener for the app: the panel under the cursor gets a soft light that follows it. */
export function useSpotlight() {
  useEffect(() => {
    if (!finePointer()) return;
    let last: HTMLElement | null = null, raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.panel');
        if (last && last !== el) last.style.removeProperty('--spot');
        if (!el) { last = null; return; }
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
        el.style.setProperty('--spot', '1');
        last = el;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);
}

/* ------------------------------------------------------- in-view reveal */

/** Fades and lifts into place the first time it scrolls into view. */
export const InView: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }} transition={{ duration: 0.6, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
};
