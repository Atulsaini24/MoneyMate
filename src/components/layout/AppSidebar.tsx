import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';
import { NAV_GROUPS, isActive } from '@/components/layout/nav';
import { Avatar, SyncStatus } from '@/components/layout/SyncStatus';
import { cn } from '@/lib/utils';

export const AppSidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { settings } = useApp();
  const { user } = useAuth();
  const name = settings.name || user?.displayName || 'You';

  return (
    <aside className="hidden lg:flex flex-col w-[256px] shrink-0 h-dvh sticky top-0 border-r border-mm-line/8 bg-mm-bg/70 backdrop-blur-xl">
      <div className="px-6 h-16 flex items-center">
        <NavLink to="/" aria-label="MoneyMate home"><MoneyMateLogo size={30} /></NavLink>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="mt-4 first:mt-1">
            <p className="px-3 pb-1.5 text-xs font-medium text-mm-muted">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(pathname, item.to);
                return (
                  <li key={item.to}>
                    <NavLink to={item.to} aria-current={active ? 'page' : undefined}
                      className={cn('group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] font-medium transition-colors',
                        active ? 'text-mm-text' : 'text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.04]')}>
                      {active && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-xl bg-mm-card shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-mm-line)_9%,transparent),0_4px_12px_-6px_rgb(0_0_0/0.15)]" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
                      {active && <motion.span layoutId="sidebar-bar" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-mm-accent" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
                      <item.icon size={18} strokeWidth={active ? 2.2 : 1.9} className={cn('relative transition-transform group-hover:scale-110', active ? 'text-mm-accent' : 'text-mm-muted group-hover:text-mm-text2')} aria-hidden />
                      <span className="relative flex-1 truncate">{item.label}</span>
                      {item.ai && <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-mm-accent/12 text-mm-accent">AI</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <NavLink to="/settings" className="m-3 p-3 rounded-2xl flex items-center gap-3 hover:bg-mm-text/[0.04] transition-colors">
        <Avatar name={name} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-mm-text truncate">{name}</span>
          <SyncStatus className="truncate max-w-full" />
        </span>
      </NavLink>
    </aside>
  );
};
