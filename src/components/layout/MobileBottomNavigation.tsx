import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowUpDown, Plus, Target, BarChart3, Mic } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { VoiceAssistantModal } from '@/components/shared/VoiceAssistantModal';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Ledger' },
  { to: '#add', icon: Plus, label: 'Add', isCenter: true },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/reports', icon: BarChart3, label: 'Analytics' },
];

export const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2 sm:pb-3 pointer-events-none bottom-nav-safe">
        <div className="bg-[#121215]/95 backdrop-blur-xl border border-[rgba(214,188,134,0.18)] rounded-2xl mx-auto max-w-md pointer-events-auto shadow-2xl shadow-black/80">
          <nav className="flex items-center justify-between px-1.5 py-1 sm:px-2 sm:py-1.5">
            {navItems.map(item => {
              if (item.isCenter) {
                return (
                  <div key="center-actions" className="relative -mt-5 sm:-mt-6 flex items-center gap-1 group px-1">
                    <button
                      onClick={() => setShowVoiceModal(true)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A1A22] text-[#D6BC86] flex items-center justify-center shadow-lg border border-[#D6BC86]/35 active:scale-95 transition-transform"
                      aria-label="Voice AI Assistant"
                      title="Voice AI"
                    >
                      <Mic size={16} strokeWidth={2.2} />
                    </button>
                    <button
                      onClick={() => setShowAddSheet(true)}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#D6BC86] text-[#0B0B0D] flex items-center justify-center shadow-md border border-[#E9D8AF]/50 active:scale-95 transition-transform"
                      aria-label="Add transaction"
                    >
                      <Plus size={20} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              }
              
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[48px] sm:min-w-[54px] flex-1"
                >
                  <div className="relative">
                    <item.icon 
                      size={18} 
                      strokeWidth={1.75}
                      className={`transition-colors ${isActive ? 'text-[#D6BC86]' : 'text-[#77736D]'}`}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-active"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-[2px] bg-[#D6BC86] rounded-full"
                        transition={{ duration: 0.15 }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-medium tracking-tight ${isActive ? 'text-[#F5F1E8]' : 'text-[#77736D]'}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <AddTransactionSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} />
      <VoiceAssistantModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </>
  );
};
