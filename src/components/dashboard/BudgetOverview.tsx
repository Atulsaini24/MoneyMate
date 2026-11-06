import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { categoryInfo } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { Button, EmptyState, LinkButton, Progress, SectionTitle } from '@/components/ui';

export const BudgetOverview: React.FC<{ budgets: { category: string; spent: number; limit: number }[] }> = ({ budgets }) => {
  const navigate = useNavigate();
  const sorted = [...budgets].sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  return (
    <section className="panel p-5 sm:p-6 h-full flex flex-col" aria-labelledby="bud-title">
      <SectionTitle id="bud-title" title="Budgets" subtitle="How each limit is holding up" action={budgets.length ? <LinkButton onClick={() => navigate('/budgets')}>Manage</LinkButton> : undefined} />
      {budgets.length === 0 ? (
        <EmptyState compact icon={PiggyBank} title="No budgets this month" description="Set a monthly limit for the categories you want to keep an eye on."
          action={<Button variant="secondary" onClick={() => navigate('/budgets')}>Set a budget</Button>} />
      ) : (
        <ul className="space-y-4 pt-1">
          {sorted.slice(0, 5).map(b => {
            const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const cat = categoryInfo(b.category, 'expense');
            const over = b.spent > b.limit;
            return (
              <li key={b.category}>
                <button onClick={() => navigate('/budgets')} className="w-full text-left group">
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                    <span className="flex-1 min-w-0 text-[15px] font-medium text-mm-text truncate">{b.category}</span>
                    <span className="text-[13px] text-mm-muted tabular">
                      <b className={`font-semibold ${over ? 'text-mm-negative' : 'text-mm-text'}`}>{formatCurrency(b.spent)}</b> of {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <Progress value={pct} tone="auto" className="mt-2 ml-11" label={`${b.category} budget used`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
