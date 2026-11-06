import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { House, ArrowLeftRight, Plus, PiggyBank, LayoutGrid, ArrowUpRight, ArrowDownLeft, Repeat, ScanLine, Mic, MessageSquareText, Moon, Sun, type LucideIcon } from 'lucide-react';
import { playPop } from '@/lib/sound';
import { useUI } from '@/context/UIContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useResolvedTheme } from '@/lib/theme';
import { haptic } from '@/lib/fx';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { Switch } from '@/components/ui';
import { NAV_GROUPS, isActive } from '@/components/layout/nav';
import { Avatar, SyncStatus } from '@/components/layout/SyncStatus';

const TABS = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Activity' },
  null,
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
];

export const MobileBottomNavigation: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { openAddSheet, setScannerOpen, setVoiceOpen } = useUI();
  const { settings, updateSettings } = useApp();
  const { user } = useAuth();
  const theme = useResolvedTheme(settings.theme);
  const [add, setAdd] = useState(false);
  const [more, setMore] = useState(false);
  const moreActive = !TABS.some(t => t && isActive(pathname, t.to));
  const name = settings.name || user?.displayName || 'You';
  useEffect(() => { setAdd(false); }, [pathname]);

  const quick: QuickAction[] = [
    { label: 'Expense', hint: 'Money out', icon: ArrowUpRight, color: '#D9573B', run: () => openAddSheet({ type: 'expense' }) },
    { label: 'Income', hint: 'Money in', icon: ArrowDownLeft, color: '#1F8A55', run: () => openAddSheet({ type: 'income' }) },
    { label: 'Transfer', hint: 'Between accounts', icon: Repeat, color: '#2F7BD8', run: () => openAddSheet({ type: 'transfer' }) },
    { label: 'Scan bill', hint: 'Photo of a receipt', icon: ScanLine, color: '#8458D4', run: () => setScannerOpen(true) },
    { label: 'Say it', hint: '“500 on petrol”', icon: Mic, color: '#C2478A', run: () => setVoiceOpen(true) },
    { label: 'Import SMS', hint: 'Bank messages', icon: MessageSquareText, color: '#C99A06', run: () => navigate('/import') },
  ];


  return (
    <>
      <nav aria-label="Main" className={cn('lg:hidden fixed inset-x-3', add ? 'z-[1102]' : 'z-40', ' bottom-[max(10px,env(safe-area-inset-bottom))] mm-dock')}>
        <div className="grid grid-cols-5 h-[64px] max-w-md mx-auto px-1.5">
          {TABS.map(tab => {
            if (!tab) {
              return (
                <div key="add" className="relative flex items-start justify-center">
                  <motion.button onClick={() => { haptic(10); playPop(); setAdd(a => !a); }} aria-label={add ? 'Close add menu' : 'Add'} aria-expanded={add} aria-haspopup="menu"
                    whileTap={{ scale: 0.88 }}
                    className="mm-fab relative z-[1101] -mt-5 w-[58px] h-[58px] rounded-[20px] text-white flex items-center justify-center">
                    <motion.span animate={{ rotate: add ? 135 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }} className="flex"><Plus size={26} strokeWidth={2.6} /></motion.span>
                  </motion.button>
                </div>
              );
            }
            const active = isActive(pathname, tab.to);
            return (
              <NavLink key={tab.to} to={tab.to} onClick={() => haptic(5)} aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5">
                {active && <motion.span layoutId="tab-active" className="absolute inset-x-1.5 inset-y-1.5 rounded-[18px] bg-mm-accent/[0.11]" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <motion.span className="relative" animate={active ? { y: [0, -4, 0], scale: [1, 1.15, 1.06] } : { y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <tab.icon size={22} strokeWidth={active ? 2.3 : 1.8} className={active ? 'text-mm-accent' : 'text-mm-muted'} />
                </motion.span>
                <span className={cn('relative text-[11px] font-semibold', active ? 'text-mm-text' : 'text-mm-muted')}>{tab.label}</span>
              </NavLink>
            );
          })}
          <button onClick={() => { haptic(5); setMore(true); }} aria-current={moreActive ? 'page' : undefined} aria-label="More sections"
            className="relative flex flex-col items-center justify-center gap-0.5">
            {moreActive && <motion.span layoutId="tab-active" className="absolute inset-x-1.5 inset-y-1.5 rounded-[18px] bg-mm-accent/[0.11]" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <LayoutGrid size={22} strokeWidth={moreActive ? 2.3 : 1.8} className={cn('relative', moreActive ? 'text-mm-accent' : 'text-mm-muted')} />
            <span className={cn('relative text-[11px] font-semibold', moreActive ? 'text-mm-text' : 'text-mm-muted')}>More</span>
          </button>
        </div>
      </nav>

      <QuickActionsMenu open={add} onClose={() => setAdd(false)} actions={quick} />


      <Dialog open={more} onClose={() => setMore(false)} title="All sections">
        <button onClick={() => { setMore(false); navigate('/settings'); }} className="w-full flex items-center gap-3 p-3 mb-4 rounded-2xl bg-mm-bg2 text-left">
          <Avatar name={name} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-mm-text truncate">{name}</span>
            <SyncStatus />
          </span>
        </button>
        {NAV_GROUPS.map(g => (
          <div key={g.title} className="mb-4">
            <p className="text-xs font-medium text-mm-muted mb-2">{g.title}</p>
            <div className="grid grid-cols-3 gap-2">
              {g.items.map(item => {
                const active = isActive(pathname, item.to);
                return (
                  <button key={item.to} onClick={() => { setMore(false); navigate(item.to); }} aria-current={active ? 'page' : undefined}
                    className={cn('flex flex-col items-start gap-2 p-3 rounded-2xl border text-left transition-colors min-h-[76px]',
                      active ? 'border-mm-accent/40 bg-mm-accent/[0.07]' : 'border-mm-line/10 bg-mm-card')}>
                    <item.icon size={20} strokeWidth={1.9} className={active ? 'text-mm-accent' : 'text-mm-text2'} />
                    <span className="text-[13px] font-semibold text-mm-text leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 py-3 border-t border-mm-line/8">
          <span className="flex items-center gap-3 text-[15px] font-medium text-mm-text">
            {theme === 'dark' ? <Moon size={19} className="text-mm-text2" /> : <Sun size={19} className="text-mm-text2" />} Dark theme
          </span>
          <Switch checked={theme === 'dark'} onChange={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' }, { silent: true })} label="Dark theme" />
        </div>
      </Dialog>
    </>
  );
};

interface QuickAction { label: string; hint: string; icon: LucideIcon; color: string; run: () => void }

/** Springs up out of the + button: six actions over a blurred page. */
const QuickActionsMenu: React.FC<{ open: boolean; onClose: () => void; actions: QuickAction[] }> = ({ open, onClose, actions }) => {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => first.current?.focus({ preventScroll: true }), 60);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); document.body.style.overflow = ''; };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-label="Add">
          <motion.button aria-label="Close" tabIndex={-1} className="absolute inset-0 w-full h-full bg-mm-bg/55 backdrop-blur-md" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div role="menu" className="absolute inset-x-3 bottom-[calc(max(10px,env(safe-area-inset-bottom))+80px)] max-w-md mx-auto p-3 rounded-[28px] bg-mm-elevated border border-mm-line/10 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] origin-bottom"
            initial={{ opacity: 0, scale: 0.6, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: 30, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}>
            <p className="px-2 pt-1 pb-3 text-[15px] font-semibold text-mm-text font-display">What would you like to add?</p>
            <div className="grid grid-cols-3 gap-2">
              {actions.map((q, k) => (
                <motion.button key={q.label} ref={k === 0 ? first : undefined} role="menuitem"
                  onClick={() => { onClose(); haptic(8); setTimeout(q.run, 140); }}
                  initial={{ opacity: 0, y: 26, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26, delay: 0.05 + k * 0.035 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex flex-col items-center gap-2 pt-3.5 pb-3 px-1 rounded-[20px] bg-mm-bg2/70 text-center">
                  <span className="relative w-12 h-12 rounded-[16px] flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${q.color} 82%, white), ${q.color} 55%, color-mix(in oklab, ${q.color} 80%, black))`, boxShadow: `0 10px 20px -10px ${q.color}, inset 0 1px 0 rgb(255 255 255 / 0.35)` }}>
                    <q.icon size={22} strokeWidth={2.2} />
                  </span>
                  <span className="text-[13px] font-semibold text-mm-text leading-tight">{q.label}</span>
                  <span className="text-[11px] text-mm-muted leading-tight -mt-1 px-1 line-clamp-1">{q.hint}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
