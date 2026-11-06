/**
 * Small, dependency-free effects: confetti and haptics.
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

const COLORS = ['#F5C451', '#0B6B63', '#4DC0AE', '#E0782F', '#2F7BD8', '#C2478A'];

/** Confetti burst from a point (defaults to the top-centre of the screen). */
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
      c: COLORS[(Math.random() * COLORS.length) | 0], life: 0,
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
