import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { buildRecap, recapMonthToOffer } from '@/lib/recap';

/** Invites the user into their Wrapped-style monthly story. */
export const RecapBanner: React.FC = () => {
  const { transactions } = useApp();
  const { openRecap } = useUI();
  const { month, complete } = recapMonthToOffer();
  const r = useMemo(() => buildRecap(transactions, month), [transactions, month]);
  if (r.txCount < 3) return null;

  return (
    <motion.button
      onClick={() => openRecap(month)}
      whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.99 }}
      className="spotlight group relative w-full overflow-hidden rounded-[22px] text-left border border-mm-gold/25 p-5 sm:p-6 flex items-center gap-5"
      style={{ background: 'linear-gradient(115deg, #2a2112 0%, #16130d 45%, #0f1a14 100%)' }}
      aria-label={`Play your ${r.monthName} recap`}
    >
      <span className="absolute inset-0 mm-shimmer opacity-40" aria-hidden />
      <span className="absolute -right-6 -top-10 text-[140px] leading-none opacity-15 rotate-12 select-none" aria-hidden>{r.persona.emoji}</span>
      <span className="relative w-14 h-14 shrink-0 rounded-2xl bg-[#D6BC86] text-[#0B0B0D] flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(214,188,134,.7)] group-hover:scale-105 transition-transform">
        <Play size={22} fill="currentColor" className="ml-0.5" />
      </span>
      <span className="relative min-w-0">
        <span className="block text-xs text-[#E9D8AF]/80">{complete ? 'Your recap is ready' : 'Your month so far'}</span>
        <span className="block font-serif text-2xl sm:text-[1.7rem] text-[#F5F1E8] leading-tight mt-0.5">
          {r.monthName}, wrapped
        </span>
        <span className="block text-sm text-[#B6B0A5] mt-1 truncate">You’ve been <b className="text-[#E9D8AF] font-medium">{r.persona.title}</b>. Tap to see why.</span>
      </span>
    </motion.button>
  );
};
