/**
 * Small, dependency-free effects: confetti, haptics and the card spotlight.
 * Every effect checks for reduced motion first.
 */
const reduced = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion'));

/** A short vibration on phones that support it. */
export function haptic(pattern: number | number[] = 8) {
  if (reduced()) return;
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

const GOLD = ['#D6BC86', '#E9D8AF', '#F5F1E8', '#83C9A5', '#C9A45C'];

/** Gold confetti burst from a point (defaults to the top-centre of the screen). */
export function confetti(opts: { x?: number; y?: number; count?: number; spread?: number } = {}) {
  if (reduced() || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '5000' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const ox = opts.x ?? innerWidth / 2, oy = opts.y ?? innerHeight * 0.3;
  const spread = opts.spread ?? 1;
  const parts = Array.from({ length: opts.count ?? 140 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * spread;
    const v = 7 + Math.random() * 9;
    return {
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      c: GOLD[(Math.random() * GOLD.length) | 0], life: 0,
    };
  });

  const start = performance.now();
  const tick = (t: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const age = t - start;
    for (const p of parts) {
      p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age / 2600);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(1, Math.cos(p.r * 2)); // paper flutter
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (age < 2700) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/**
 * One pointer listener for the whole app: the card under the cursor gets
 * --mx/--my so its ::before glow follows the pointer.
 */
export function installSpotlight() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) return () => {};
  let last: HTMLElement | null = null;
  let raf = 0;
  const onMove = (e: PointerEvent) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.glass-card, .glass-card-elevated, .spotlight');
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
  return () => window.removeEventListener('pointermove', onMove);
}
