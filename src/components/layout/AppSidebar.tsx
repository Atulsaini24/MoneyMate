import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Target,
  BarChart3, Users, Settings, Cloud, CloudOff, Search, Download, Landmark, ReceiptIndianRupee, UsersRound, Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

const navItems = [
  { section: 'Money', to: '/', icon: LayoutDashboard, label: 'Overview' },
  { section: 'Money', to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { section: 'Money', to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { section: 'Money', to: '/reports', icon: BarChart3, label: 'Analytics' },
  { section: 'Plan', to: '/goals', icon: Target, label: 'Savings goals' },
  { section: 'Plan', to: '/wealth', icon: Landmark, label: 'Wealth' },
  { section: 'Plan', to: '/tax', icon: ReceiptIndianRupee, label: 'Tax planner' },
  { section: 'People', to: '/friends', icon: Users, label: 'Debts & IOUs' },
  { section: 'People', to: '/groups', icon: UsersRound, label: 'Groups' },
  { section: 'Tools', to: '/ask', icon: Sparkles, label: 'Ask MoneyMate', ai: true },
  { section: 'Tools', to: '/import', icon: Download, label: 'Import' },
  { section: '', to: '/settings', icon: Settings, label: 'Settings' },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { syncStatus, isCloudSynced } = useApp();
  const { user } = useAuth();
  const { setPaletteOpen } = useUI();
  const syncLabel = !isCloudSynced ? 'Saved on this device' : syncStatus === 'syncing' ? 'Saving…' : syncStatus === 'offline' ? 'Offline, will retry' : 'All changes saved';

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen sticky top-0 bg-mm-bg border-r border-mm-line/12 z-30 select-none">
      {/* Brand Logo */}
      <div className="px-6 py-5 border-b border-mm-line/8">
        <NavLink to="/" className="block group">
          <MoneyMateLogo size={34} showText={true} />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full mb-3 flex items-center gap-3 px-3.5 py-2 rounded-xl border border-mm-line/12 text-mm-muted hover:text-mm-text hover:border-mm-line/25 transition-colors"
        >
          <Search size={16} strokeWidth={1.75} />
          <span className="text-[13px] flex-1 text-left">Search</span>
          <kbd className="text-[10px] border border-mm-line/20 rounded px-1.5 font-sans">/</kbd>
        </button>
        {navItems.map((item, idx) => {
          const header = item.section && (idx === 0 || navItems[idx - 1].section !== item.section);
          const isActive = location.pathname === item.to || 
            (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <React.Fragment key={item.to}>
            {header && <p className="px-3.5 pt-4 pb-1.5 text-[11px] font-medium text-mm-muted first:pt-0">{item.section}</p>}
            {!item.section && <div className="h-px bg-mm-line/10 my-3 mx-3" />}
            <NavLink
              to={item.to}
              className="relative block"
            >
              <div className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-200 group ${
                isActive ? 'text-mm-text' : 'text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.03]'
              }`}>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-mm-gold/15 to-mm-gold/[0.04] border border-mm-gold/25"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon
                  size={18}
                  strokeWidth={1.75}
                  className={`relative transition-colors ${isActive ? 'text-mm-gold' : 'text-mm-muted group-hover:text-mm-text2'}`}
                />
                <span className="relative text-[13px] font-medium tracking-tight flex-1">{item.label}</span>
                {'ai' in item && item.ai && <span className="relative text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-mm-gold/20 text-mm-gold shrink-0">AI</span>}
              </div>
            </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-mm-line/8">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-mm-bg2 border border-mm-line/8">
          {syncStatus === 'offline' ? <CloudOff size={14} className="text-mm-warning" strokeWidth={1.75} /> : <Cloud size={14} className="text-mm-gold" strokeWidth={1.75} />}
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-mm-text">{syncLabel}</span>
            <span className="text-[10px] text-mm-muted truncate">{user?.email || 'Sign in to sync devices'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
