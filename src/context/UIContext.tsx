import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AddTransactionSheet, AddTransactionSheetProps } from '@/components/transactions/AddTransactionSheet';

type Prefill = AddTransactionSheetProps['prefill'];

interface UIContextType {
  openAddSheet: (opts?: { type?: 'expense' | 'income' | 'transfer'; prefill?: Prefill }) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  /** Month (YYYY-MM) whose recap story is open, or null */
  recap: string | null;
  openRecap: (month: string) => void;
  closeRecap: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/** App-wide overlays that any screen, shortcut or command can open. */
export function UIProvider({ children, onTogglePrivacy }: { children: React.ReactNode; onTogglePrivacy: () => void }) {
  const [sheet, setSheet] = useState<{ open: boolean; type: 'expense' | 'income' | 'transfer'; prefill?: Prefill; key: number }>({
    open: false, type: 'expense', key: 0,
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const openRecap = useCallback((m: string) => setRecap(m), []);
  const closeRecap = useCallback(() => setRecap(null), []);

  const openAddSheet = useCallback<UIContextType['openAddSheet']>(opts => {
    setSheet(s => ({ open: true, type: opts?.prefill?.type || opts?.type || 'expense', prefill: opts?.prefill, key: s.key + 1 }));
  }, []);

  // Home-screen shortcuts from the PWA manifest arrive as ?action=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (!action) return;
    if (action === 'add-expense') openAddSheet({ type: 'expense' });
    if (action === 'scan') setScannerOpen(true);
    params.delete('action');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [openAddSheet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
        return;
      }
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n') { e.preventDefault(); openAddSheet({ type: 'expense' }); }
      else if (e.key === 'i') { e.preventDefault(); openAddSheet({ type: 'income' }); }
      else if (e.key === 'h') { e.preventDefault(); onTogglePrivacy(); }
      else if (e.key === '/') { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAddSheet, onTogglePrivacy]);

  const value = useMemo(
    () => ({ openAddSheet, paletteOpen, setPaletteOpen, scannerOpen, setScannerOpen, recap, openRecap, closeRecap }),
    [openAddSheet, paletteOpen, scannerOpen, recap, openRecap, closeRecap]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <AddTransactionSheet
        key={sheet.key}
        isOpen={sheet.open}
        defaultType={sheet.type}
        prefill={sheet.prefill}
        onClose={() => setSheet(s => ({ ...s, open: false }))}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
