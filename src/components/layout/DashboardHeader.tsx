import React, { useState } from 'react';
import { 
  Search, Bell, Moon, Sun, ChevronDown, Compass, Calendar as CalendarIcon,
  Menu, X, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, BarChart3,
  Users, Settings as SettingsIcon, Cloud, CloudOff, Mic, Eye, EyeOff, RefreshCw, Download, Landmark, ReceiptIndianRupee, Sparkles 
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { OnboardingTourModal } from '@/components/shared/OnboardingTourModal';
import { AuthModal } from '@/components/shared/AuthModal';
import { VoiceAssistantModal } from '@/components/shared/VoiceAssistantModal';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

const drawerNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Savings Goals' },
  { to: '/reports', icon: BarChart3, label: 'Analytics' },
  { to: '/friends', icon: Users, label: 'Debts & IOUs' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/wealth', icon: Landmark, label: 'Wealth' },
  { to: '/tax', icon: ReceiptIndianRupee, label: 'Tax planner' },
  { to: '/ask', icon: Sparkles, label: 'Ask MoneyMate' },
  { to: '/import', icon: Download, label: 'Import' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export const DashboardHeader: React.FC = () => {
  const { settings, updateSettings, isCloudSynced, syncStatus, togglePrivacy } = useApp();
  const { setPaletteOpen } = useUI();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const syncLabel = !isCloudSynced ? 'Not syncing' : syncStatus === 'syncing' ? 'Saving…' : syncStatus === 'offline' ? 'Offline, will retry' : 'All changes saved';
  const toggleTheme = () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }, { silent: true });
  const { user } = useAuth();
    const [showTour, setShowTour] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      {/* Mobile Top App Bar (Unified across all pages) */}
      <header className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-mm-line/10 bg-mm-bg/95 backdrop-blur-xl sticky top-0 z-30 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-mm-bg2 border border-mm-line/12 text-mm-gold active:scale-95 transition-transform flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu size={17} strokeWidth={1.75} />
          </button>
          <div className="min-w-0">
            <MoneyMateLogo size={28} showText={true} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">

          <button
            onClick={() => setShowVoice(true)}
            className="p-2 rounded-xl bg-mm-gold/15 border border-mm-gold/35 text-mm-gold active:scale-95 transition-transform"
            aria-label="Voice Assistant"
            title="MoneyMate Voice AI"
          >
            <Mic size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-xl bg-mm-bg2 border border-mm-line/12 text-mm-text2 active:scale-95 transition-transform"
            aria-label="Search"
          >
            <Search size={15} strokeWidth={1.75} />
          </button>
          <NotificationCenter compact />
          {/* Mobile Theme Toggle with Spring Animation */}
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-mm-bg2 border border-mm-line/16 text-mm-gold shadow-sm flex items-center justify-center transition-colors"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? (
              <Moon size={15} strokeWidth={2} className="text-mm-gold" />
            ) : (
              <Sun size={15} strokeWidth={2} className="text-[#E5A93C]" />
            )}
          </motion.button>
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-mm-card border border-mm-line/25 flex items-center justify-center text-xs font-semibold text-mm-gold active:scale-95 transition-transform flex-shrink-0"
            aria-label="Account Settings"
          >
            {settings.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="overlay-bg absolute inset-0"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-72 max-w-[80vw] h-full bg-mm-bg border-r border-mm-line/18 shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-mm-line/10">
                <MoneyMateLogo size={28} showText={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-mm-text/5 text-mm-muted hover:text-mm-text"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-mm-muted">
                  Navigation
                </p>
                {drawerNavItems.map(item => {
                  const isActive = location.pathname === item.to || 
                    (item.to !== '/' && location.pathname.startsWith(item.to));

                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        navigate(item.to);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left ${
                        isActive
                          ? 'bg-mm-card border border-mm-line/25 text-mm-text shadow-sm font-semibold'
                          : 'text-mm-text2 hover:bg-mm-bg2 hover:text-mm-text'
                      }`}
                    >
                      <item.icon
                        size={17}
                        strokeWidth={1.75}
                        className={isActive ? 'text-mm-gold' : 'text-mm-muted'}
                      />
                      <span className="text-xs tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-mm-line/10">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-mm-bg2 border border-mm-line/8">
                  <Cloud size={14} className="text-mm-gold" strokeWidth={1.75} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-mm-text">{syncLabel}</span>
                    <span className="text-[10px] text-mm-muted">{user?.email || 'Saved on this device'}</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-mm-line/10 bg-mm-bg/90 backdrop-blur-md sticky top-0 z-30">
        {/* Left: Date & Search */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 w-72 pl-3 pr-2 py-1.5 rounded-lg bg-mm-bg2 border border-mm-line/12 text-xs text-mm-muted hover:border-mm-gold/40 transition-colors"
          >
            <Search size={14} strokeWidth={1.75} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="text-[10px] border border-mm-line/20 rounded px-1.5 py-0.5 font-sans">{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cloud Sync button */}
          <button
            onClick={() => setShowAuth(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
              !isCloudSynced
                ? 'bg-mm-bg2 border-mm-line/12 hover:border-mm-gold/40 text-mm-text2 hover:text-mm-text'
                : syncStatus === 'offline'
                ? 'bg-mm-warning/12 border-mm-warning/30 text-mm-warning'
                : 'bg-mm-positive/12 border-mm-positive/25 text-mm-positive'
            }`}
            title={isCloudSynced ? `Signed in as ${user?.email}` : 'Sign in to sync'}
          >
            {!isCloudSynced || syncStatus === 'offline' ? <CloudOff size={14} /> : syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
            <span>{syncLabel}</span>
          </button>

          {/* Voice AI Assistant Button */}
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mm-gold/15 border border-mm-gold/35 hover:bg-mm-gold/25 text-mm-gold text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-sm"
            title="MoneyMate Voice AI (Hindi, Punjabi, English)"
          >
            <Mic size={14} strokeWidth={2.2} />
            <span>Voice</span>
          </button>

          {/* Guide Tour button */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mm-bg2 border border-mm-line/12 hover:border-mm-gold/40 text-xs font-medium text-mm-text2 hover:text-mm-text transition-all"
            title="Overview Guide"
          >
            <Compass size={13} className="text-mm-gold" strokeWidth={1.75} />
            <span>Tour</span>
          </button>

          {/* Desktop Theme toggle with Fluid Kinetic Animation */}
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-mm-bg2 border border-mm-line/14 hover:border-mm-gold/40 text-mm-gold transition-colors shadow-sm"
            aria-label="Toggle theme"
            title={settings.theme === 'dark' ? 'Switch to Ivory Light Theme' : 'Switch to Obsidian Dark Theme'}
          >
            {settings.theme === 'dark' ? (
              <Moon size={16} strokeWidth={2} className="text-mm-gold" />
            ) : (
              <Sun size={16} strokeWidth={2} className="text-[#E5A93C]" />
            )}
          </motion.button>

          <button
            onClick={togglePrivacy}
            className="p-2 rounded-lg hover:bg-mm-bg2 text-mm-text2 hover:text-mm-text transition-colors"
            aria-label={settings.privacyMode ? 'Show amounts' : 'Hide amounts'}
            aria-pressed={Boolean(settings.privacyMode)}
            title={settings.privacyMode ? 'Show amounts (H)' : 'Hide amounts (H)'}
          >
            {settings.privacyMode ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
          </button>

          <NotificationCenter />

          {/* Profile */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-mm-bg2 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-mm-card border border-mm-line/25 flex items-center justify-center text-xs font-semibold text-mm-gold">
              {settings.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden xl:inline text-xs font-medium text-mm-text whitespace-nowrap">{settings.name}</span>
            <ChevronDown size={12} className="text-mm-muted" />
          </button>
        </div>
      </header>

      <OnboardingTourModal isOpen={showTour} onClose={() => setShowTour(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <VoiceAssistantModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
    </>
  );
};
