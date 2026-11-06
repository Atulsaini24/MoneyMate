import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MoneyScene, SceneMode } from './moneyScene';
import { cn } from '@/lib/utils';

/**
 * Lazy-loads the three.js scene on first mount, so pages without 3D never
 * download it. Shows `fallback` if WebGL isn't available.
 */
export const MoneyCanvas: React.FC<{
  mode: SceneMode; value?: number; maxCoins?: number; className?: string; fallback?: React.ReactNode; label?: string; interactive?: boolean;
}> = ({ mode, value = 0, maxCoins, className, fallback = null, label, interactive = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MoneyScene | null>(null);
  const reduced = Boolean(useReducedMotion());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    let cancelled = false;
    import('./moneyScene').then(mod => {
      if (cancelled || !ref.current) return;
      if (!mod.webglAvailable()) { setFailed(true); return; }
      try {
        sceneRef.current = mod.createMoneyScene(ref.current, { mode, value: valueRef.current, reduced, maxCoins });
        setReady(true);
      } catch { setFailed(true); }
    }).catch(() => setFailed(true));
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [mode, maxCoins]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { sceneRef.current?.setValue(value); }, [value]);
  useEffect(() => { sceneRef.current?.setReduced(reduced); }, [reduced]);

  if (failed) return <>{fallback}</>;
  return (
    <motion.div ref={ref} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      onClick={interactive ? () => sceneRef.current?.hop() : undefined}
      data-cursor={interactive ? 'Tap' : undefined}
      initial={{ opacity: 0, scale: 0.92 }} animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(interactive && 'cursor-pointer', className)} />
  );
};
