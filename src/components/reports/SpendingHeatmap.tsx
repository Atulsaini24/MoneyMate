import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dailySpend } from '@/lib/insights';
import { formatCurrency, cn } from '@/lib/utils';
import { Stat } from '@/components/ui';

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
const LEVELS = ['bg-mm-text/[0.06]', 'bg-mm-accent/25', 'bg-mm-accent/45', 'bg-mm-accent/70', 'bg-mm-accent'];
const WEEKDAYS = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

/** Each square is a day; darker means more spent. */
export const SpendingHeatmap: React.FC = () => {
  const { transactions } = useApp();
  const { days, p90 } = useMemo(() => dailySpend(transactions, 26), [transactions]);
  const [hover, setHover] = useState<(typeof days)[number] | null>(null);

  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const past = days.filter(d => !d.future);
  const spendDays = past.filter(d => d.amount > 0);
  const noSpend = past.length - spendDays.length;
  const busiest = spendDays.reduce<(typeof days)[number] | null>((m, d) => (!m || d.amount > m.amount ? d : m), null);
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const d of spendDays) byWeekday[(d.date.getDay() + 6) % 7] += d.amount;
  const top = byWeekday.indexOf(Math.max(...byWeekday));
  const level = (amt: number) => (amt <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((amt / Math.max(1, p90)) * 4))));

  return (
    <div className="space-y-4">
      {spendDays.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat className="panel p-4" label="No-spend days" value={noSpend} tone="positive" hint="last 6 months" />
          <Stat className="panel p-4" label="Biggest day" value={busiest ? formatCurrency(busiest.amount) : '–'} hint={busiest?.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} />
          <Stat className="panel p-4" label="You spend most on" value={WEEKDAYS[top]} />
        </div>
      )}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-[17px] font-semibold text-mm-text">Spending calendar</h2>
          <p className="text-[13px] text-mm-muted tabular min-h-5" aria-live="polite">
            {hover ? `${hover.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${hover.amount ? formatCurrency(hover.amount) : 'nothing spent'}` : 'Tap or hover a day'}
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
          <div className="flex gap-[3px] min-w-max">
            <div className="flex flex-col gap-[3px] mr-1.5">
              {DAY_LABELS.map((l, i) => <span key={i} className="h-3.5 lg:h-[18px] text-[10px] leading-[14px] lg:leading-[18px] text-mm-muted">{l}</span>)}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {w.map(d => (
                  <button key={d.key} disabled={d.future} onMouseEnter={() => setHover(d)} onFocus={() => setHover(d)} onClick={() => setHover(d)} onMouseLeave={() => setHover(null)}
                    aria-label={`${d.date.toDateString()}: ${d.amount ? formatCurrency(d.amount) : 'nothing spent'}`}
                    className={cn('w-3.5 h-3.5 lg:w-[18px] lg:h-[18px] rounded-[4px] sensitive', d.future ? 'opacity-0' : LEVELS[level(d.amount)], hover?.key === d.key && 'ring-2 ring-mm-text/60')} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-mm-muted">Less {LEVELS.map((c, i) => <span key={i} className={`w-3 h-3 rounded-[3px] ${c}`} />)} More</div>
      </section>
    </div>
  );
};
