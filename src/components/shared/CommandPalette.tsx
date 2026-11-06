import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ArrowDownLeft, ScanLine, Moon, Sun, EyeOff, Eye, CornerDownLeft, Repeat, MessageSquareText, Clapperboard, Mic,
} from 'lucide-react';
import { NAV_ITEMS } from '@/components/layout/nav';
import { useResolvedTheme } from '@/lib/theme';
import { recapMonthToOffer } from '@/lib/recap';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { categoryInfo } from '@/types';
import { MerchantLogo } from '@/components/shared/MerchantLogo';
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


export const CommandPalette: React.FC = () => {
  const { paletteOpen, setPaletteOpen, openAddSheet, setScannerOpen, setVoiceOpen, openRecap } = useUI();
  const { transactions, settings, updateSettings, togglePrivacy } = useApp();
  const navigate = useNavigate();
  const theme = useResolvedTheme(settings.theme);
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
      { id: 'a-tr', group: 'Actions', label: 'Add transfer', icon: ic(Repeat), run: () => openAddSheet({ type: 'transfer' }) },
      { id: 'a-scan', group: 'Actions', label: 'Scan a receipt', icon: ic(ScanLine), run: () => setScannerOpen(true) },
      { id: 'a-voice', group: 'Actions', label: 'Add by voice', icon: ic(Mic), run: () => setVoiceOpen(true) },
      { id: 'a-import', group: 'Actions', label: 'Import bank SMS or statement', icon: ic(MessageSquareText), run: () => navigate('/import') },
      { id: 'a-recap', group: 'Actions', label: 'Play my monthly recap', icon: ic(Clapperboard), run: () => openRecap(recapMonthToOffer().month) },
      {
        id: 'a-theme', group: 'Actions', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: ic(theme === 'dark' ? Sun : Moon),
        run: () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' }, { silent: true }),
      },
      {
        id: 'a-priv', group: 'Actions', label: settings.privacyMode ? 'Show amounts' : 'Hide amounts', keys: 'H',
        icon: ic(settings.privacyMode ? Eye : EyeOff), run: togglePrivacy,
      },
    ];
    const pages: Item[] = [
      ...NAV_ITEMS.map(n => ({ id: `p-${n.to}`, label: n.label, hint: n.description, to: n.to, I: n.icon })),
      { id: 'p-sub', label: 'Subscriptions & bills', hint: 'Repeating payments', to: '/reports?tab=subscriptions', I: Repeat },
    ].map(p => ({ id: p.id, group: 'Go to' as const, label: p.label, hint: p.hint, icon: ic(p.I), run: () => navigate(p.to) }));

    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const match = (text: string) => tokens.every(t => text.toLowerCase().includes(t));

    const txItems: Item[] = !q ? [] : transactions
      .filter(t => match(`${t.description} ${t.category} ${t.notes || ''} ${t.paymentMethod || ''} ${t.amount}`))
      .slice(0, 8)
      .map(t => {
        const cat = categoryInfo(t.category, t.type);
        return {
          id: `t-${t.id}`, group: 'Transactions' as const,
          label: t.description,
          hint: `${t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '−'}${formatCurrency(t.amount)} · ${formatDate(t.date)}`,
          icon: <MerchantLogo description={t.description} icon={cat.icon} color={cat.color} size="sm" />,
          run: () => navigate(`/transactions?search=${encodeURIComponent(t.description)}`),
        };
      });

    return [...actions.filter(i => !q || match(i.label)), ...pages.filter(i => !q || match(i.label)), ...txItems];
  }, [query, transactions, theme, settings.privacyMode, openAddSheet, setScannerOpen, setVoiceOpen, openRecap, updateSettings, togglePrivacy, navigate]);

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
        <div className="fixed inset-0 z-[1100] flex items-start justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="overlay-bg absolute inset-0" onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl panel-raised rounded-[22px] border border-mm-line/10 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-mm-line/10">
              <Search size={17} className="text-mm-muted shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search transactions or type a command"
                className="flex-1 bg-transparent py-4 text-[15px] text-mm-text placeholder:text-mm-muted focus:outline-none focus-visible:outline-none"
                aria-controls="palette-list"
                aria-activedescendant={items[active]?.id}
              />
              <button onClick={close} className="text-[13px] font-semibold text-mm-accent sm:hidden">Cancel</button>
              <kbd className="hidden sm:block text-[11px] text-mm-muted bg-mm-bg2 rounded-md px-1.5 py-0.5 font-sans">Esc</kbd>
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
                    {header && <p className="px-3 pt-3 pb-1.5 text-xs font-medium text-mm-muted">{header}</p>}
                    <button
                      id={item.id}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => { item.run(); close(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        i === active ? 'bg-mm-accent/10 text-mm-text' : 'text-mm-text2'
                      }`}
                    >
                      <span className={i === active ? 'text-mm-accent' : 'text-mm-muted'}>{item.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-[15px] font-medium">{item.label}</span>
                        {item.hint && <span className="sm:hidden block truncate text-xs text-mm-muted tabular">{item.hint}</span>}
                      </span>
                      {item.hint && <span className="text-xs text-mm-muted tabular shrink-0 hidden sm:inline">{item.hint}</span>}
                      {item.keys && <kbd className="hidden sm:inline text-[11px] text-mm-muted bg-mm-bg2 rounded-md px-1.5 py-0.5 font-sans">{item.keys}</kbd>}
                      {i === active && !item.keys && <CornerDownLeft size={13} className="text-mm-muted shrink-0" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-mm-line/8 text-xs text-mm-muted">
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
