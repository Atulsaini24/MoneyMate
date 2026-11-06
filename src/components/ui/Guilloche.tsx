import React, { useMemo } from 'react';

/**
 * The fine interlaced line-work engraved on banknotes, drawn as SVG so it stays
 * crisp at any size. Purely decorative.
 */
export const Guilloche: React.FC<{ className?: string; lines?: number }> = ({ className, lines = 18 }) => {
  const paths = useMemo(() => {
    const out: string[] = [];
    const W = 600, H = 300, steps = 160;
    for (let k = 0; k < lines; k++) {
      const amp = 34 + k * 3.2;
      const phase = (k / lines) * Math.PI * 2;
      const freq = 2.5;
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * W;
        const t = (i / steps) * Math.PI * 2 * freq;
        const y = H / 2 + Math.sin(t + phase) * amp * Math.cos(t / 5 + k * 0.15) + Math.sin(t * 3 + phase) * 6;
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      out.push(d);
    }
    return out;
  }, [lines]);
  return (
    <svg viewBox="0 0 600 300" preserveAspectRatio="none" className={className} aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
};
