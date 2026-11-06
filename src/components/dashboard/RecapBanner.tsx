import React, { useMemo } from 'react';
import { Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { buildRecap, recapMonthToOffer } from '@/lib/recap';

/** Invites the user into their animated monthly recap, once there's enough to tell. */
export const RecapBanner: React.FC = () => {
  const { transactions } = useApp();
  const { openRecap } = useUI();
  const { month, complete } = recapMonthToOffer();
  const r = useMemo(() => buildRecap(transactions, month), [transactions, month]);
  if (r.txCount < 3) return null;
  return (
    <button onClick={() => openRecap(month)} aria-label={`Play your ${r.monthName} recap`}
      className="group w-full panel lift p-4 sm:p-5 flex items-center gap-4 text-left hover:border-mm-line/20">
      <span className="w-12 h-12 rounded-2xl bg-mm-note text-[var(--color-mm-marigold)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <Play size={20} fill="currentColor" className="ml-0.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-mm-muted">{complete ? 'Your monthly recap is ready' : 'Your month so far'}</span>
        <span className="block text-[17px] font-semibold text-mm-text font-display">{r.monthName}, in eight slides</span>
      </span>
      <span className="hidden sm:block text-[13px] text-mm-text2 max-w-[16rem] truncate">You’ve been <b className="text-mm-text">{r.persona.title}</b></span>
    </button>
  );
};
