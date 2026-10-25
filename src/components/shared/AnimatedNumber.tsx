import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

/** Counts up to `value` once on mount and eases between later changes. */
export const AnimatedNumber: React.FC<{
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}> = ({ value, format = n => formatCurrency(n), duration = 900, className }) => {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration, reduce]);

  return <span className={className}>{format(Math.round(display))}</span>;
};
