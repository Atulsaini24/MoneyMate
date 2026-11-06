import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { haptic } from '@/lib/fx';
import { playCoin } from '@/lib/sound';

const THRESHOLD = 72;
const MAX = 120;

/**
 * Pull down at the top of any page on a phone: a gold coin drops in, spins
 * faster the further you pull, and syncs when you let go past the line.
 */
export const PullToRefresh: React.FC = () => {
  const { refreshCloudData } = useApp();
  const { user } = useAuth();
  const userId = user?.uid;
  const pull = useMotionValue(0);
  const [busy, setBusy] = useState(false);
  const armed = useRef(false);
  const busyRef = useRef(false);
  const rotate = useTransform(pull, [0, MAX], [0, 540]);
  const scale = useTransform(pull, [0, THRESHOLD], [0.4, 1]);
  const opacity = useTransform(pull, [0, 24, THRESHOLD], [0, 0.6, 1]);
  const y = useTransform(pull, v => v * 0.75 - 40);

  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    let startY = 0, tracking = false;
    const blocked = () => window.scrollY > 0 || document.querySelector('[aria-modal="true"]') || busyRef.current;
    const onStart = (e: TouchEvent) => {
      if (blocked() || e.touches.length !== 1) return;
      startY = e.touches[0].clientY; tracking = true; armed.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) { pull.set(0); return; }
      // Rubber-band: harder to pull the further it goes
      const v = Math.min(MAX, dy * 0.55 - (dy * dy) / 4000);
      pull.set(Math.max(0, v));
      if (!armed.current && v >= THRESHOLD) { armed.current = true; haptic(12); }
      if (armed.current && v < THRESHOLD) armed.current = false;
    };
    const onEnd = async () => {
      if (!tracking) return;
      tracking = false;
      if (!armed.current) { animate(pull, 0, { type: 'spring', stiffness: 400, damping: 34 }); return; }
      busyRef.current = true; setBusy(true);
      animate(pull, THRESHOLD, { type: 'spring', stiffness: 400, damping: 30 });
      playCoin();
      try { await Promise.all([userId ? refreshCloudData() : Promise.resolve(), new Promise(r => setTimeout(r, 900))]); }
      finally {
        haptic(8);
        animate(pull, 0, { type: 'spring', stiffness: 300, damping: 30 });
        busyRef.current = false; setBusy(false);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [pull, refreshCloudData, userId]);

  return (
    <motion.div aria-hidden className="lg:hidden fixed left-1/2 top-[calc(env(safe-area-inset-top)+56px)] z-[45] -ml-[22px] pointer-events-none" style={{ y, opacity }}>
      <motion.div className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[20px] text-[#7A4F05]"
        style={{ rotateY: rotate, scale, background: 'radial-gradient(circle at 34% 28%, #FFE8A3 0%, #F5C451 40%, #D99A1E 80%, #B57A10 100%)', boxShadow: '0 10px 24px -8px rgb(169 110 12 / 0.6), inset 0 0 0 3px rgb(255 255 255 / 0.2)' }}
        animate={busy ? { rotateY: [0, 360] } : undefined} transition={busy ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : undefined}>
        ₹
      </motion.div>
    </motion.div>
  );
};
