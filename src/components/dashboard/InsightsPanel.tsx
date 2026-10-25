import React, { useState } from 'react';
import { useInsights } from '@/lib/useInsights';
import { InsightList } from '@/components/dashboard/InsightList';

export const InsightsPanel: React.FC = () => {
  const { insights } = useInsights();
  const [all, setAll] = useState(false);
  const shown = all ? insights : insights.slice(0, 4);

  return (
    <section className="glass-card p-5" aria-labelledby="insights-title">
      <div className="flex items-baseline justify-between mb-1">
        <h2 id="insights-title" className="text-sm font-semibold text-mm-text">What needs your attention</h2>
        <span className="text-xs text-mm-muted">{insights.length ? `${insights.length} insight${insights.length === 1 ? '' : 's'}` : ''}</span>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-mm-text2 py-6">All clear. Budgets are on pace and nothing is due this week.</p>
      ) : (
        <>
          <InsightList insights={shown} />
          {insights.length > 4 && (
            <button onClick={() => setAll(a => !a)} className="mt-2 text-xs font-medium text-mm-gold hover:text-mm-gold-light">
              {all ? 'Show fewer' : `Show all ${insights.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
};
