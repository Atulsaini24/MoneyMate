import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useInsights } from '@/lib/useInsights';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Eye, EyeOff, Moon, Sun, ScanLine, Mic } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { useResolvedTheme } from '@/lib/theme';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { LogoMark } from '@/components/shared/MoneyMateLogo';
import { Button, IconButton } from '@/components/ui';

export const TopBar: React.FC = () => {
  const { settings, updateSettings, togglePrivacy } = useApp();
  const { setPaletteOpen, openAddSheet, setScannerOpen, setVoiceOpen } = useUI();
  const theme = useResolvedTheme(settings.theme);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const { pathname } = useLocation();
  const { forecast } = useInsights();
  const [scrolled, setScrolled] = useState(false);
  const [deep, setDeep] = useState(false);
  useEffect(() => {
    const on = () => { setScrolled(window.scrollY > 8); setDeep(window.scrollY > 300); };
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const showSafe = pathname === '/' && deep && forecast.income > 0;
  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' }, { silent: true });

  return (
    <header className={cn('sticky top-0 z-40 backdrop-blur-xl border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-300',
      scrolled ? 'bg-mm-bg/80 border-mm-line/10 shadow-[0_8px_24px_-18px_rgb(0_0_0/0.35)]' : 'bg-transparent border-transparent')}>
      {/* Phones */}
      <div className="lg:hidden flex items-center gap-1 h-14 px-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-1 pl-1" aria-label="MoneyMate home">
          <LogoMark size={28} />
          <span className="relative h-7 flex-1 min-w-0 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              {showSafe ? (
                <motion.span key="safe" className="absolute inset-y-0 left-0 flex items-center gap-1.5 whitespace-nowrap"
                  initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -22, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                  <span className="amount text-lg font-semibold text-mm-text">{formatCurrency(Math.round(forecast.safeToSpendDaily))}</span>
                  <span className="text-[13px] text-mm-muted">safe today</span>
                </motion.span>
              ) : (
                <motion.span key="name" className="absolute inset-y-0 left-0 flex items-center font-display text-lg font-semibold text-mm-text whitespace-nowrap"
                  initial={{ y: -22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 22, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                  MoneyMate
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </Link>
        <IconButton label="Search" icon={Search} onClick={() => setPaletteOpen(true)} />
        <IconButton label={settings.privacyMode ? 'Show amounts' : 'Hide amounts'} icon={settings.privacyMode ? EyeOff : Eye} onClick={togglePrivacy} aria-pressed={Boolean(settings.privacyMode)} />
        <NotificationCenter />
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-2 h-16 px-6 xl:px-10">
        <button onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-3 w-full max-w-[420px] h-10 pl-3.5 pr-2 rounded-xl bg-mm-card border border-mm-line/12 text-sm text-mm-muted hover:border-mm-line/25 transition-colors">
          <Search size={17} />
          <span className="flex-1 text-left">Search transactions or jump to…</span>
          <kbd className="text-[11px] font-sans font-medium text-mm-muted bg-mm-bg2 rounded-md px-1.5 py-0.5">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="flex-1" />
        <IconButton label="Scan a receipt" icon={ScanLine} onClick={() => setScannerOpen(true)} />
        <IconButton label="Add by voice" icon={Mic} onClick={() => setVoiceOpen(true)} />
        <IconButton label={settings.privacyMode ? 'Show amounts (H)' : 'Hide amounts (H)'} icon={settings.privacyMode ? EyeOff : Eye} onClick={togglePrivacy} aria-pressed={Boolean(settings.privacyMode)} />
        <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="relative w-10 h-10 inline-flex items-center justify-center rounded-xl text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.06] transition-colors overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={theme} initial={{ y: 18, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -18, rotate: 90, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <NotificationCenter />
        <Button icon={Plus} onClick={() => openAddSheet({ type: 'expense' })} className="ml-2">Add transaction</Button>
      </div>
    </header>
  );
};
