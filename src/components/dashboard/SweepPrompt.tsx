import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { sweepOffer } from '@/lib/autopilot';
import { Sheet, btnPrimary, btnGhost } from '@/components/shared/Sheet';
import { formatCurrency } from '@/lib/utils';
import { confetti } from '@/lib/fx';

/** Early each month: "You kept ₹X last month. Move some into a goal?" */
export const SweepPrompt: React.FC = () => {
  const { transactions, goals, settings, updateSettings, addMoneyToGoal } = useApp();
  const offer = useMemo(() => (settings.sweepEnabled === false ? null : sweepOffer(transactions, new Date(), settings.lastSweepMonth)), [transactions, settings.sweepEnabled, settings.lastSweepMonth]);
  const open = goals.filter(g => g.savedAmount < g.targetAmount);
  const [show, setShow] = useState(false);
  const [goalId, setGoalId] = useState('');
  const [pct, setPct] = useState(50);

  useEffect(() => { if (offer && open.length) { const t = setTimeout(() => setShow(true), 1500); return () => clearTimeout(t); } }, [offer, open.length]);
  useEffect(() => { if (open[0] && !goalId) setGoalId(open[0].id); }, [open, goalId]);
  if (!offer || !open.length) return null;

  const amount = Math.round((offer.surplus * pct) / 100 / 100) * 100;
  const done = (moved: boolean) => {
    updateSettings({ lastSweepMonth: offer.month }, { silent: true });
    if (moved && amount > 0) { addMoneyToGoal(goalId, amount); confetti(); }
    setShow(false);
  };
  const month = new Date(`${offer.month}-01T12:00:00`).toLocaleDateString(undefined, { month: 'long' });

  return (
    <Sheet open={show} onClose={() => done(false)} title={`You kept ${formatCurrency(offer.surplus)} in ${month}`}
      footer={<div className="flex gap-2"><button onClick={() => done(false)} className={`${btnGhost} flex-1`}>Not now</button><button onClick={() => done(true)} className={`${btnPrimary} flex-1`}>Move {formatCurrency(amount)}</button></div>}>
      <p className="text-sm text-mm-text2">Money that sits in your account tends to get spent. Put some of it to work on a goal.</p>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-mm-text2 mb-2"><span>How much?</span><span className="text-mm-text font-semibold number-display">{pct}% · {formatCurrency(amount)}</span></div>
        <input type="range" min={10} max={100} step={10} value={pct} onChange={e => setPct(+e.target.value)} className="w-full accent-[var(--color-mm-gold)]" aria-label="Share of surplus to move" />
      </div>
      <div className="grid gap-2 mt-5">
        {open.map(g => (
          <button key={g.id} onClick={() => setGoalId(g.id)} aria-pressed={goalId === g.id}
            className={`flex items-center justify-between p-3 rounded-xl border text-left ${goalId === g.id ? 'border-mm-gold bg-mm-gold/10' : 'border-mm-line/12'}`}>
            <span className="text-sm text-mm-text">{g.name}</span>
            <span className="text-xs text-mm-muted number-display">{Math.round((g.savedAmount / g.targetAmount) * 100)}% funded</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
};
