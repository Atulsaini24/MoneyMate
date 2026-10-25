import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, ArrowUpDown, Plus, Sparkles, BarChart3, ArrowDownLeft, ScanLine, MessageSquareText, Receipt } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { haptic } from '@/lib/fx';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Activity' },
  null, // centre button
  { to: '/ask', icon: Sparkles, label: 'Ask' },
  { to: '/reports', icon: BarChart3, label: 'Insights' },
];

export const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAddSheet, setScannerOpen } = useUI();
  const [dial, setDial] = useState(false);

  // Fanned out above the + button, left to right
  const actions = [
    { label: 'Income', icon: ArrowDownLeft, run: () => openAddSheet({ type: 'income' }), color: '#83C9A5' },
    { label: 'Expense', icon: Receipt, run: () => openAddSheet({ type: 'expense' }), color: '#D6BC86' },
    { label: 'Scan', icon: ScanLine, run: () => setScannerOpen(true), color: '#E9D8AF' },
    { label: 'Import', icon: MessageSquareText, run: () => navigate('/import'), color: '#8FB3D9' },
  ];
  const fan = [{ x: -122, y: -84 }, { x: -46, y: -132 }, { x: 46, y: -132 }, { x: 122, y: -84 }];

  const toggle = () => { haptic(dial ? 5 : 12); setDial(d => !d); };

  return (
    <>
      <AnimatePresence>
        {dial && (
          <motion.div className="lg:hidden fixed inset-0 z-40 bg-mm-bg/70 backdrop-blur-sm" onClick={() => setDial(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden />
        )}
      </AnimatePresence>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="relative mx-auto max-w-md pointer-events-auto">
          {/* Speed dial */}
          <AnimatePresence>
            {dial && actions.map((a, k) => (
              <motion.button key={a.label}
                onClick={() => { setDial(false); haptic(8); a.run(); }}
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: fan[k].x, y: fan[k].y, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0.3, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 22, delay: k * 0.035 }}
                className="absolute z-20 left-1/2 top-0 -ml-7 w-14 flex flex-col items-center gap-1"
                aria-label={a.label === 'Import' ? 'Import bank SMS' : `Add ${a.label.toLowerCase()}`}
              >
                <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-mm-elevated border border-mm-line/25 shadow-xl" style={{ color: a.color }}>
                  <a.icon size={22} strokeWidth={1.9} />
                </span>
                <span className="text-[11px] font-medium text-mm-text">{a.label}</span>
              </motion.button>
            ))}
          </AnimatePresence>

          <nav className="relative z-10 liquid-dock rounded-[22px] flex items-center justify-between px-2 py-1.5">
            {navItems.map((item, k) => {
              if (!item) {
                return (
                  <div key="fab" className="relative -mt-7 px-1">
                    <motion.button onClick={toggle} whileTap={{ scale: 0.9 }}
                      className="relative w-[58px] h-[58px] rounded-[20px] bg-mm-gold text-mm-on-gold flex items-center justify-center shadow-[0_12px_30px_-6px_rgba(214,188,134,.65)]"
                      aria-label={dial ? 'Close quick add' : 'Quick add'} aria-expanded={dial}>
                      {!dial && <span className="absolute inset-0 rounded-[20px] border-2 border-mm-gold animate-ping opacity-20" aria-hidden />}
                      <motion.span animate={{ rotate: dial ? 135 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                        <Plus size={26} strokeWidth={2.4} />
                      </motion.span>
                    </motion.button>
                  </div>
                );
              }
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <NavLink key={item.to} to={item.to} onClick={() => haptic(5)}
                  className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl" aria-current={active ? 'page' : undefined}>
                  {active && (
                    <motion.span layoutId="mobile-pill" className="absolute inset-x-1.5 inset-y-0 rounded-2xl bg-mm-gold/12 border border-mm-gold/20"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }} />
                  )}
                  <motion.span animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }} className="relative">
                    <item.icon size={19} strokeWidth={active ? 2.1 : 1.75} className={active ? 'text-mm-gold' : 'text-mm-muted'} />
                  </motion.span>
                  <span className={`relative text-[10px] font-medium ${active ? 'text-mm-text' : 'text-mm-muted'}`}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};
