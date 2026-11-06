import React, { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { InsightList } from '@/components/dashboard/InsightList';
import { LinkButton, SectionTitle } from '@/components/ui';

export const InsightsPanel: React.FC = () => {
  const { insights } = useInsights();
  const [all, setAll] = useState(false);
  const shown = all ? insights : insights.slice(0, 4);
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="insights-title">
      <SectionTitle id="insights-title" title="Needs your attention" className="mb-1"
        action={insights.length > 4 ? <LinkButton onClick={() => setAll(a => !a)}>{all ? 'Show fewer' : `Show all ${insights.length}`}</LinkButton> : undefined} />
      {insights.length === 0 ? (
        <p className="flex items-center gap-2.5 text-sm text-mm-text2 py-5"><CircleCheck size={18} className="text-mm-positive shrink-0" />Nothing right now. Budgets are on pace and nothing is overdue.</p>
      ) : <InsightList insights={shown} />}
    </section>
  );
};
