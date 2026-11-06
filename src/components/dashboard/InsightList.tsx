import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert, CircleAlert, Info, Sparkles, ChevronRight } from 'lucide-react';
import type { Insight } from '@/lib/insights';
import { cn } from '@/lib/utils';

const toneStyle: Record<Insight['tone'], { icon: React.ElementType; cls: string }> = {
  alert: { icon: TriangleAlert, cls: 'text-mm-negative bg-mm-negative/10' },
  warn: { icon: CircleAlert, cls: 'text-mm-warning bg-mm-warning/12' },
  good: { icon: Sparkles, cls: 'text-mm-positive bg-mm-positive/10' },
  info: { icon: Info, cls: 'text-mm-accent bg-mm-accent/10' },
};

export const InsightList: React.FC<{ insights: Insight[]; onNavigate?: () => void }> = ({ insights, onNavigate }) => {
  const navigate = useNavigate();
  return (
    <ul className="divide-hairline">
      {insights.map(item => {
        const { icon: Icon, cls } = toneStyle[item.tone];
        const body = (
          <>
            <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cls)}><Icon size={17} strokeWidth={2} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-mm-text leading-snug">{item.title}</span>
              <span className="block text-[13px] text-mm-text2 mt-0.5 leading-relaxed">{item.body}</span>
            </span>
            {item.action && <ChevronRight size={17} className="text-mm-muted shrink-0 mt-2 group-hover:text-mm-accent transition-colors" />}
          </>
        );
        return (
          <li key={item.id}>
            {item.action ? (
              <button onClick={() => { navigate(item.action!.to); onNavigate?.(); }}
                className="group w-full flex items-start gap-3 py-3 px-2 -mx-2 text-left rounded-xl hover:bg-mm-text/[0.03] transition-colors"
                aria-label={`${item.title}. ${item.action.label}`}>{body}</button>
            ) : (
              <div className="flex items-start gap-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
