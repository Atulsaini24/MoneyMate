import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartPie } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { categoryInfo } from '@/types';
import { EmptyState, LinkButton, SectionTitle } from '@/components/ui';

export const SpendingDonutChart: React.FC<{ data: { name: string; value: number }[]; total: number }> = ({ data, total }) => {
  const navigate = useNavigate();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const [active, setActive] = useState<number | null>(null);
  const focus = active !== null ? sorted[active] : null;
  return (
    <section className="panel p-5 sm:p-6 h-full flex flex-col" aria-labelledby="cat-title">
      <SectionTitle id="cat-title" title="Where it went" subtitle="This month by category" action={<LinkButton onClick={() => navigate('/reports?tab=categories')}>Details</LinkButton>} />
      {sorted.length === 0 ? (
        <EmptyState compact icon={ChartPie} title="No spending yet this month" description="Your categories show up here as you add expenses." />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 my-auto pt-2">
          <div className="relative w-44 h-44 shrink-0 sensitive">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sorted} innerRadius={58} outerRadius={82} paddingAngle={sorted.length > 1 ? 2 : 0} dataKey="value" stroke="none" isAnimationActive animationDuration={900} animationEasing="ease-out"
                  onMouseEnter={(_: unknown, i: number) => setActive(i)} onMouseLeave={() => setActive(null)} onClick={(_: unknown, i: number) => setActive(a => (a === i ? null : i))}>
                  {sorted.map((d, i) => <Cell key={d.name} fill={categoryInfo(d.name, 'expense').color} fillOpacity={active === null || active === i ? 1 : 0.28}
                    style={{ transition: 'fill-opacity 0.25s', cursor: 'pointer', outline: 'none' }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-mm-muted max-w-[96px] truncate">{focus ? focus.name : 'Spent'}</span>
              <span className="amount text-lg font-semibold text-mm-text">{formatCurrency(focus ? focus.value : total, { compact: (focus ? focus.value : total) >= 100000 })}</span>
            </div>
          </div>
          <ul className="flex-1 w-full space-y-2.5">
            {sorted.slice(0, 6).map((item, i) => (
              <li key={item.name} className={`flex items-center gap-2.5 text-sm rounded-lg -mx-1.5 px-1.5 py-0.5 transition-colors ${active === i ? 'bg-mm-text/[0.05]' : ''}`}
                onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: categoryInfo(item.name, 'expense').color }} />
                <span className="flex-1 text-mm-text2 truncate">{item.name}</span>
                <span className="text-mm-muted tabular text-[13px] w-10 text-right">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                <span className="font-semibold text-mm-text tabular w-24 text-right">{formatCurrency(item.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
