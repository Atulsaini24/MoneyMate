import React from 'react';
import { formatCurrency } from '@/lib/utils';

/** Recharts tooltip in the app's own style. */
export const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel-raised rounded-xl border border-mm-line/10 px-3 py-2 text-[13px]">
      <p className="font-semibold text-mm-text mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-mm-text2 tabular">
          <i className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />{p.name}: <b className="text-mm-text">{formatCurrency(p.value)}</b>
        </p>
      ))}
    </div>
  );
};
