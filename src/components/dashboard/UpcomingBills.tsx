import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { EXPENSE_CATEGORIES } from '@/types';

const when = (d: number) => (d < 0 ? `${-d}d overdue` : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`);

export const UpcomingBills: React.FC = () => {
  const { recurring } = useInsights();
  const upcoming = recurring.filter(r => r.daysUntil >= -3 && r.daysUntil <= 30).slice(0, 5);
  const monthly = recurring.reduce((s, r) => s + r.amount, 0);

  return (
    <section className="glass-card p-5" aria-labelledby="bills-title">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="bills-title" className="text-sm font-semibold text-mm-text">Upcoming bills</h2>
        {recurring.length > 0 && (
          <Link to="/reports?tab=subscriptions" className="text-xs text-mm-gold hover:text-mm-gold-light">
            {formatCurrency(monthly)}/mo in total
          </Link>
        )}
      </div>
      {upcoming.length === 0 ? (
        <div className="flex gap-3 py-4 text-sm text-mm-text2">
          <CalendarClock size={18} className="text-mm-muted shrink-0" />
          <p className="leading-relaxed">
            Repeating payments like rent, phone and streaming show up here automatically once they've happened twice.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {upcoming.map(r => {
            const cat = EXPENSE_CATEGORIES.find(c => c.name === r.category);
            return (
              <li key={r.key} className="flex items-center gap-3 py-2">
                <CategoryIcon name={cat?.icon || 'Circle'} color={cat?.color || '#D6BC86'} size={15} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-mm-text truncate">{r.name}</p>
                  <p className={`text-xs ${r.daysUntil <= 2 ? 'text-mm-warning' : 'text-mm-muted'}`}>{when(r.daysUntil)}</p>
                </div>
                <span className="text-sm text-mm-text number-display">{formatCurrency(r.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
