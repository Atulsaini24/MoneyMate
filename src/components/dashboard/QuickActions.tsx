import React from 'react';
import { Plus, ArrowDownLeft, MessageSquareText, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '@/context/UIContext';

export const QuickActions: React.FC = () => {
  const { openAddSheet, setScannerOpen } = useUI();
  const navigate = useNavigate();

  const actions = [
    { label: 'Add expense', hint: 'Shortcut: N', icon: Plus, run: () => openAddSheet({ type: 'expense' }), primary: true },
    { label: 'Add income', hint: 'Shortcut: I', icon: ArrowDownLeft, run: () => openAddSheet({ type: 'income' }) },
    { label: 'Import SMS', hint: 'Bank texts or statement', icon: MessageSquareText, run: () => navigate('/import') },
    { label: 'Scan receipt', hint: 'Fills in the details', icon: ScanLine, run: () => setScannerOpen(true) },
  ];

  return (
    <section aria-label="Quick actions" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={a.run}
          className={`spotlight flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border transition-all text-left active:scale-[0.98] hover:-translate-y-0.5 min-w-0 ${
            a.primary
              ? 'bg-mm-card border-mm-line/30 hover:border-mm-gold text-mm-text'
              : 'bg-mm-bg2 border-mm-line/10 hover:border-mm-line/25 text-mm-text2 hover:text-mm-text'
          }`}
        >
          <span className={`p-2 rounded-lg shrink-0 ${a.primary ? 'bg-mm-gold/15 text-mm-gold' : 'bg-mm-card text-mm-text2'}`}>
            <a.icon size={16} strokeWidth={1.75} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">{a.label}</span>
            <span className="text-[11px] text-mm-muted truncate mt-0.5">{a.hint}</span>
          </span>
        </button>
      ))}
    </section>
  );
};
