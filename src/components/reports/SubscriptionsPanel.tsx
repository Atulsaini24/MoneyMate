import React from 'react';
import { Repeat } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MerchantLogo } from '@/components/shared/MerchantLogo';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { categoryInfo } from '@/types';
import { EmptyState, Stat } from '@/components/ui';

const when = (d: number) => (d < 0 ? `${-d} day${d === -1 ? '' : 's'} late` : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`);

export const SubscriptionsPanel: React.FC = () => {
  const { recurring, forecast } = useInsights();
  const monthly = recurring.reduce((s, r) => s + r.amount, 0);
  if (!recurring.length) {
    return (
      <div className="panel">
        <EmptyState icon={Repeat} title="No repeating payments found yet"
          description="When the same payment shows up about a month apart, like rent or a streaming plan, it’s listed here and you’re reminded before it’s due." />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat className="panel p-4" label="Each month" value={formatCurrency(monthly)} />
        <Stat className="panel p-4" label="Each year" value={formatCurrency(monthly * 12)} />
        <Stat className="panel p-4" label="Of usual income" value={forecast.income > 0 ? `${Math.round((monthly / forecast.income) * 100)}%` : '–'} tone="accent" />
      </div>
      <section className="panel px-5 sm:px-6 py-2">
        <ul className="divide-hairline">
          {[...recurring].sort((a, b) => a.daysUntil - b.daysUntil).map(r => {
            const cat = categoryInfo(r.category, 'expense');
            return (
              <li key={r.key} className="flex items-center gap-3 py-3">
                <MerchantLogo description={r.name} icon={cat.icon} color={cat.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-mm-text truncate">{r.name}</p>
                  <p className="text-[13px] text-mm-muted">Last paid {formatDate(r.lastDate)} · seen {r.occurrences} times</p>
                </div>
                <div className="text-right">
                  <p className="amount font-semibold text-mm-text">{formatCurrency(r.amount)}</p>
                  <p className={`text-[13px] ${r.daysUntil < 0 ? 'text-mm-negative' : r.daysUntil <= 3 ? 'text-mm-warning' : 'text-mm-muted'}`}>{when(r.daysUntil)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
