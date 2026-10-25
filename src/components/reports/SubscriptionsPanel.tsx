import React from 'react';
import { Repeat } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { EXPENSE_CATEGORIES } from '@/types';

export const SubscriptionsPanel: React.FC = () => {
  const { recurring, forecast } = useInsights();
  const monthly = recurring.reduce((s, r) => s + r.amount, 0);

  if (!recurring.length) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-mm-gold/12 text-mm-gold flex items-center justify-center mx-auto mb-3"><Repeat size={22} /></div>
        <h3 className="text-sm font-semibold text-mm-text">No repeating payments found yet</h3>
        <p className="text-sm text-mm-text2 mt-1.5 max-w-sm mx-auto leading-relaxed">
          When the same payment shows up about a month apart, like rent or a streaming plan, MoneyMate lists it here and warns you before it's due.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 sm:p-5">
          <p className="text-xs text-mm-muted">Every month</p>
          <p className="text-2xl font-semibold text-mm-text number-display mt-1">{formatCurrency(monthly)}</p>
        </div>
        <div className="glass-card p-4 sm:p-5">
          <p className="text-xs text-mm-muted">Every year</p>
          <p className="text-2xl font-semibold text-mm-text number-display mt-1">{formatCurrency(monthly * 12)}</p>
        </div>
        <div className="glass-card p-4 sm:p-5">
          <p className="text-xs text-mm-muted">Share of usual income</p>
          <p className="text-2xl font-semibold text-mm-gold number-display mt-1">
            {forecast.income > 0 ? `${Math.round((monthly / forecast.income) * 100)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="glass-card p-2 sm:p-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mm-muted">
              <th className="font-medium px-3 py-2">Payment</th>
              <th className="font-medium px-3 py-2 hidden sm:table-cell">Last paid</th>
              <th className="font-medium px-3 py-2">Next</th>
              <th className="font-medium px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recurring.map(r => {
              const cat = EXPENSE_CATEGORIES.find(c => c.name === r.category);
              return (
                <tr key={r.key} className="border-t border-mm-line/8">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon name={cat?.icon || 'Circle'} color={cat?.color || '#D6BC86'} size={14} />
                      <div className="min-w-0">
                        <p className="text-mm-text truncate">{r.name}</p>
                        <p className="text-[11px] text-mm-muted">{r.occurrences} payments seen</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-mm-text2 hidden sm:table-cell">{formatDate(r.lastDate)}</td>
                  <td className={`px-3 py-3 ${r.daysUntil <= 3 ? 'text-mm-warning' : 'text-mm-text2'}`}>
                    {r.daysUntil < 0 ? `${-r.daysUntil}d late` : r.daysUntil === 0 ? 'Today' : `${r.daysUntil}d`}
                  </td>
                  <td className="px-3 py-3 text-right text-mm-text number-display">{formatCurrency(r.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
