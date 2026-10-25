import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dailySpend } from '@/lib/insights';
import { formatCurrency } from '@/lib/utils';

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

/** GitHub-style calendar: each square is a day, darker gold means more spent. */
export const SpendingHeatmap: React.FC = () => {
  const { transactions } = useApp();
  const { days, p90 } = useMemo(() => dailySpend(transactions, 26), [transactions]);
  const [hover, setHover] = useState<(typeof days)[number] | null>(null);

  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const spendDays = days.filter(d => d.amount > 0 && !d.future);
  const noSpend = days.filter(d => d.amount === 0 && !d.future).length;
  const busiest = spendDays.reduce<(typeof days)[number] | null>((m, d) => (!m || d.amount > m.amount ? d : m), null);
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const d of spendDays) weekdayTotals[(d.date.getDay() + 6) % 7] += d.amount;
  const topWeekday = weekdayTotals.indexOf(Math.max(...weekdayTotals));
  const weekdayNames = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

  const level = (amt: number) => (amt <= 0 ? 0 : Math.min(4, Math.ceil((amt / p90) * 4)));
  const levelClass = ['bg-mm-text/[0.06]', 'bg-mm-gold/25', 'bg-mm-gold/45', 'bg-mm-gold/70', 'bg-mm-gold'];

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-mm-text">Spending calendar</h3>
        <p className="text-xs text-mm-muted min-h-4 number-display" aria-live="polite">
          {hover
            ? `${hover.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${hover.amount ? formatCurrency(hover.amount) : 'no spending'}`
            : 'Last 6 months. Hover a day for details.'}
        </p>
      </div>

      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex gap-[3px] min-w-max">
          <div className="flex flex-col gap-[3px] mr-1.5">
            {DAY_LABELS.map((l, i) => <span key={i} className="h-3 sm:h-3.5 lg:h-[18px] text-[9px] leading-3 sm:leading-[14px] lg:leading-[18px] text-mm-muted">{l}</span>)}
          </div>
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {w.map(d => (
                <button
                  key={d.key}
                  disabled={d.future}
                  onMouseEnter={() => setHover(d)}
                  onFocus={() => setHover(d)}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${d.date.toDateString()}: ${d.amount ? formatCurrency(d.amount) : 'no spending'}`}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-[18px] lg:h-[18px] rounded-[3px] sensitive ${d.future ? 'opacity-0' : levelClass[level(d.amount)]} hover:ring-1 hover:ring-mm-text/50`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-mm-muted">
        Less {levelClass.map((c, i) => <span key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />)} More
      </div>

      {spendDays.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-mm-bg2 p-3.5">
            <p className="text-xs text-mm-muted">No-spend days</p>
            <p className="text-lg font-semibold text-mm-positive number-display mt-0.5">{noSpend}</p>
          </div>
          <div className="rounded-xl bg-mm-bg2 p-3.5">
            <p className="text-xs text-mm-muted">Biggest day</p>
            <p className="text-lg font-semibold text-mm-text number-display mt-0.5">{busiest ? formatCurrency(busiest.amount) : '—'}</p>
            {busiest && <p className="text-[11px] text-mm-muted">{busiest.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>}
          </div>
          <div className="rounded-xl bg-mm-bg2 p-3.5">
            <p className="text-xs text-mm-muted">You spend most on</p>
            <p className="text-lg font-semibold text-mm-gold mt-0.5">{weekdayNames[topWeekday]}</p>
          </div>
        </div>
      )}
    </div>
  );
};
