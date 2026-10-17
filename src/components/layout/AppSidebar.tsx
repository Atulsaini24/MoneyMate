import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Target,
  BarChart3, Users, Settings, ShieldCheck
} from 'lucide-react';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Savings Goals' },
  { to: '/reports', icon: BarChart3, label: 'Analytics' },
  { to: '/friends', icon: Users, label: 'Debts & IOUs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen sticky top-0 bg-[#0B0B0D] border-r border-[rgba(214,188,134,0.12)] z-30 select-none">
      {/* Brand Logo */}
      <div className="px-6 py-5 border-b border-[rgba(214,188,134,0.08)]">
        <NavLink to="/" className="block group">
          <MoneyMateLogo size={34} showText={true} />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#77736D]">
          Menu
        </p>
        {navItems.map(item => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative block"
            >
              <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 group ${
                isActive 
                  ? 'bg-[#17171B] border border-[rgba(214,188,134,0.22)] text-[#F5F1E8] shadow-sm' 
                  : 'hover:bg-[#121215] text-[#B6B0A5] hover:text-[#F5F1E8] border border-transparent'
              }`}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#D6BC86] rounded-r-full"
                    transition={{ duration: 0.15 }}
                  />
                )}
                <item.icon 
                  size={18} 
                  strokeWidth={1.75}
                  className={`transition-colors ${isActive ? 'text-[#D6BC86]' : 'text-[#77736D] group-hover:text-[#B6B0A5]'}`}
                />
                <span className="text-[13px] font-medium tracking-tight">
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-[rgba(214,188,134,0.08)]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.08)]">
          <ShieldCheck size={14} className="text-[#D6BC86]" strokeWidth={1.75} />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#F5F1E8]">End-to-End Encrypted</span>
            <span className="text-[9px] text-[#77736D]">Client-Side Storage</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
