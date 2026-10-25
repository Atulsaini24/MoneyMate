import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ArrowDownLeft, ScanLine, Moon, Sun, EyeOff, Eye, LayoutDashboard, ArrowLeftRight,
  PiggyBank, Target, BarChart3, Users, Settings, CornerDownLeft, Repeat, MessageSquareText, Clapperboard, Sparkles, Landmark, ReceiptIndianRupee, UsersRound,
} from 'lucide-react';
import { recapMonthToOffer } from '@/lib/recap';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

interface Item {
  id: string;
  group: 'Actions' | 'Go to' | 'Transactions';
  label: string;
  hint?: string;
  keys?: string;
  icon: React.ReactNode;
  run: () => void;
}

const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CommandPalette: React.FC = () => {
  const { paletteOpen, setPaletteOpen, openAddSheet, setScannerOpen, openRecap } = useUI();
  const { transactions, settings, updateSettings, togglePrivacy } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => setPaletteOpen(false);

  useEffect(() => {
    if (paletteOpen) { setQuery(''); setActive(0); }
  }, [paletteOpen]);

  const items = useMemo<Item[]>(() => {
    const ic = (I: React.ElementType) => <I size={16} strokeWidth={1.75} />;
    const actions: Item[] = [
      { id: 'a-exp', group: 'Actions', label: 'Add expense', keys: 'N', icon: ic(Plus), run: () => openAddSheet({ type: 'expense' }) },
      { id: 'a-inc', group: 'Actions', label: 'Add income', keys: 'I', icon: ic(ArrowDownLeft), run: () => openAddSheet({ type: 'income' }) },
      { id: 'a-scan', group: 'Actions', label: 'Scan a receipt', icon: ic(ScanLine), run: () => setScannerOpen(true) },
      { id: 'a-import', group: 'Actions', label: 'Import bank SMS or statement', icon: ic(MessageSquareText), run: () => navigate('/import') },
      { id: 'a-recap', group: 'Actions', label: 'Play my monthly recap', icon: ic(Clapperboard), run: () => openRecap(recapMonthToOffer().month) },
      {
        id: 'a-theme', group: 'Actions', label: settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: ic(settings.theme === 'dark' ? Sun : Moon),
        run: () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }, { silent: true }),
      },
      {
        id: 'a-priv', group: 'Actions', label: settings.privacyMode ? 'Show amounts' : 'Hide amounts', keys: 'H',
        icon: ic(settings.privacyMode ? Eye : EyeOff), run: togglePrivacy,
      },
    ];
    const pages: Item[] = [
      { id: 'p-home', label: 'Overview', to: '/', I: LayoutDashboard },
      { id: 'p-tx', label: 'Transactions', to: '/transactions', I: ArrowLeftRight },
      { id: 'p-bud', label: 'Budgets', to: '/budgets', I: PiggyBank },
      { id: 'p-goal', label: 'Savings goals', to: '/goals', I: Target },
      { id: 'p-rep', label: 'Analytics', to: '/reports', I: BarChart3 },
      { id: 'p-sub', label: 'Subscriptions & bills', to: '/reports?tab=subscriptions', I: Repeat },
      { id: 'p-iou', label: 'Debts & IOUs', to: '/friends', I: Users },
      { id: 'p-ask', label: 'Ask MoneyMate (AI)', to: '/ask', I: Sparkles },
      { id: 'p-wealth', label: 'Wealth & net worth', to: '/wealth', I: Landmark },
      { id: 'p-tax', label: 'Tax planner', to: '/tax', I: ReceiptIndianRupee },
      { id: 'p-groups', label: 'Groups & splits', to: '/groups', I: UsersRound },
      { id: 'p-set', label: 'Settings', to: '/settings', I: Settings },
    ].map(p => ({ id: p.id, group: 'Go to' as const, label: p.label, icon: ic(p.I), run: () => navigate(p.to) }));

    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const match = (text: string) => tokens.every(t => text.toLowerCase().includes(t));

    const txItems: Item[] = !q ? [] : transactions
      .filter(t => match(`${t.description} ${t.category} ${t.notes || ''} ${t.paymentMethod || ''} ${t.amount}`))
      .slice(0, 8)
      .map(t => {
        const cat = allCategories.find(c => c.name === t.category);
        return {
          id: `t-${t.id}`, group: 'Transactions' as const,
          label: t.description,
          hint: `${t.type === 'income' ? '+' : '−'}${formatCurrency(t.amount)} · ${formatDate(t.date)}`,
          icon: <CategoryIcon name={cat?.icon || 'Circle'} color={cat?.color || '#D6BC86'} size={14} />,
          run: () => navigate(`/transactions?search=${encodeURIComponent(t.description)}`),
        };
      });

    return [...actions.filter(i => !q || match(i.label)), ...pages.filter(i => !q || match(i.label)), ...txItems];
  }, [query, transactions, settings.theme, settings.privacyMode, openAddSheet, setScannerOpen, openRecap, updateSettings, togglePrivacy, navigate]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && items[active]) { e.preventDefault(); items[active].run(); close(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  let lastGroup = '';

  return createPortal(
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center px-3 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overlay-bg absolute inset-0" onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl glass-card-elevated overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-mm-line/12">
              <Search size={17} className="text-mm-muted shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search transactions or type a command"
                className="flex-1 bg-transparent py-4 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus-visible:outline-none"
                aria-controls="palette-list"
                aria-activedescendant={items[active]?.id}
              />
              <kbd className="hidden sm:block text-[10px] text-mm-muted border border-mm-line/20 rounded px-1.5 py-0.5">Esc</kbd>
            </div>

            <div ref={listRef} id="palette-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-mm-muted">Nothing matches “{query}”.</p>
              )}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <React.Fragment key={item.id}>
                    {header && <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium text-mm-muted">{header}</p>}
                    <button
                      id={item.id}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => { item.run(); close(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        i === active ? 'bg-mm-gold/12 text-mm-text' : 'text-mm-text2'
                      }`}
                    >
                      <span className={i === active ? 'text-mm-gold' : 'text-mm-muted'}>{item.icon}</span>
                      <span className="flex-1 min-w-0 truncate text-sm">{item.label}</span>
                      {item.hint && <span className="text-xs text-mm-muted number-display shrink-0">{item.hint}</span>}
                      {item.keys && <kbd className="text-[10px] text-mm-muted border border-mm-line/20 rounded px-1.5 py-0.5">{item.keys}</kbd>}
                      {i === active && !item.keys && <CornerDownLeft size={13} className="text-mm-muted shrink-0" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-mm-line/10 text-[11px] text-mm-muted">
              <span><kbd className="font-sans">↑↓</kbd> to move</span>
              <span><kbd className="font-sans">↵</kbd> to open</span>
              <span className="ml-auto">Press <kbd className="font-sans">N</kbd> anywhere to add an expense</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
