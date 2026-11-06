import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { formatCurrency } from '@/lib/utils';
import { MerchantLogo } from '@/components/shared/MerchantLogo';
import { categoryInfo } from '@/types';
import { LinkButton, SectionTitle } from '@/components/ui';

const when = (d: number) => (d < 0 ? `${-d} day${d === -1 ? '' : 's'} overdue` : d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `In ${d} days`);

export const UpcomingBills: React.FC = () => {
  const { recurring } = useInsights();
  const navigate = useNavigate();
  const upcoming = recurring.filter(r => r.daysUntil >= -3 && r.daysUntil <= 30).slice(0, 5);
  const monthly = recurring.reduce((s, r) => s + r.amount, 0);
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="bills-title">
      <SectionTitle id="bills-title" title="Coming up" subtitle={recurring.length ? `${formatCurrency(monthly)} a month in repeating payments` : undefined}
        action={recurring.length ? <LinkButton onClick={() => navigate('/reports?tab=subscriptions')}>All bills</LinkButton> : undefined} />
      {upcoming.length === 0 ? (
        <div className="flex gap-3 py-3 text-sm text-mm-text2">
          <CalendarClock size={18} className="text-mm-muted shrink-0 mt-0.5" />
          <p className="leading-relaxed">Rent, phone and streaming payments appear here on their own once they’ve happened twice, about a month apart.</p>
        </div>
      ) : (
        <ul className="divide-hairline">
          {upcoming.map(r => {
            const cat = categoryInfo(r.category, 'expense');
            return (
              <li key={r.key} className="flex items-center gap-3 py-2.5">
                <MerchantLogo description={r.name} icon={cat.icon} color={cat.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-mm-text truncate">{r.name}</p>
                  <p className={`text-[13px] ${r.daysUntil < 0 ? 'text-mm-negative' : r.daysUntil <= 2 ? 'text-mm-warning' : 'text-mm-muted'}`}>{when(r.daysUntil)}</p>
                </div>
                <span className="amount text-[15px] font-semibold text-mm-text">{formatCurrency(r.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
