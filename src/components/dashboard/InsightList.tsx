import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CircleAlert, Info, Sparkles, ChevronRight } from 'lucide-react';
import type { Insight } from '@/lib/insights';

const toneStyle: Record<Insight['tone'], { icon: React.ElementType; cls: string }> = {
  alert: { icon: AlertTriangle, cls: 'text-mm-negative bg-mm-negative/12' },
  warn: { icon: CircleAlert, cls: 'text-mm-warning bg-mm-warning/12' },
  good: { icon: Sparkles, cls: 'text-mm-positive bg-mm-positive/12' },
  info: { icon: Info, cls: 'text-mm-gold bg-mm-gold/12' },
};

export const InsightList: React.FC<{ insights: Insight[]; onNavigate?: () => void; dense?: boolean }> = ({ insights, onNavigate, dense }) => {
  const navigate = useNavigate();
  return (
    <ul className="divide-y divide-mm-line/8">
      {insights.map(item => {
        const { icon: Icon, cls } = toneStyle[item.tone];
        const clickable = Boolean(item.action);
        const body = (
          <>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
              <Icon size={15} strokeWidth={2} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-mm-text leading-snug">{item.title}</span>
              <span className={`block text-xs text-mm-text2 mt-0.5 leading-relaxed ${dense ? 'line-clamp-2' : ''}`}>{item.body}</span>
            </span>
            {clickable && <ChevronRight size={15} className="text-mm-muted shrink-0 mt-1.5 group-hover:text-mm-gold transition-colors" />}
          </>
        );
        return (
          <li key={item.id}>
            {clickable ? (
              <button
                onClick={() => { navigate(item.action!.to); onNavigate?.(); }}
                className="group w-full flex items-start gap-3 py-3 text-left hover:bg-mm-text/[0.03] -mx-2 px-2 rounded-xl transition-colors"
                aria-label={`${item.title}. ${item.action!.label}`}
              >
                {body}
              </button>
            ) : (
              <div className="flex items-start gap-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
