import React, { useState } from 'react';
import { 
  Search, Bell, Moon, Sun, ChevronDown, Compass, Calendar as CalendarIcon,
  Menu, X, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, BarChart3,
  Users, Settings as SettingsIcon, ShieldCheck, Cloud, CloudOff, Mic 
} from 'lucide-react';
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
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export const DashboardHeader: React.FC = () => {
  const { settings, updateSettings, isCloudSynced } = useApp();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showTour, setShowTour] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      {/* Mobile Top App Bar (Unified across all pages) */}
      <header className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-[rgba(214,188,134,0.1)] bg-[#0B0B0D]/95 backdrop-blur-xl sticky top-0 z-30 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.12)] text-[#D6BC86] active:scale-95 transition-transform flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu size={17} strokeWidth={1.75} />
          </button>
          <div className="min-w-0">
            <MoneyMateLogo size={28} showText={true} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Cloud Sync Status Button */}
          <button
            onClick={() => setShowAuth(true)}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isCloudSynced 
                ? 'bg-[#83C9A5]/15 border-[#83C9A5]/30 text-[#83C9A5]' 
                : 'bg-[#121215] border-[rgba(214,188,134,0.12)] text-[#D6BC86]'
            }`}
            aria-label="Cloud Sync"
            title={isCloudSynced ? 'Synced with Firebase' : 'Connect Firebase Cloud'}
          >
            {isCloudSynced ? <Cloud size={15} strokeWidth={2} /> : <CloudOff size={15} strokeWidth={1.75} />}
          </button>
          <button
            onClick={() => setShowVoice(true)}
            className="p-2 rounded-xl bg-[#D6BC86]/15 border border-[#D6BC86]/35 text-[#D6BC86] active:scale-95 transition-transform"
            aria-label="Voice Assistant"
            title="MoneyMate Voice AI"
          >
            <Mic size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowTour(true)}
            className="hidden sm:flex p-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.12)] text-[#D6BC86] active:scale-95 transition-transform"
            aria-label="Product Tour Guide"
            title="Product Tour"
          >
            <Compass size={15} strokeWidth={1.75} />
          </button>
          {/* Mobile Theme Toggle with Spring Animation */}
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-[#D6BC86] shadow-sm flex items-center justify-center transition-colors"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? (
              <Moon size={15} strokeWidth={2} className="text-[#D6BC86]" />
            ) : (
              <Sun size={15} strokeWidth={2} className="text-[#E5A93C]" />
            )}
          </motion.button>
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-[#17171B] border border-[rgba(214,188,134,0.25)] flex items-center justify-center text-xs font-semibold text-[#D6BC86] active:scale-95 transition-transform flex-shrink-0"
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
              className="relative w-72 max-w-[80vw] h-full bg-[#0B0B0D] border-r border-[rgba(214,188,134,0.18)] shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(214,188,134,0.1)]">
                <MoneyMateLogo size={28} showText={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#77736D] hover:text-[#F5F1E8]"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#77736D]">
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
                          ? 'bg-[#17171B] border border-[rgba(214,188,134,0.25)] text-[#F5F1E8] shadow-sm font-semibold'
                          : 'text-[#B6B0A5] hover:bg-[#121215] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <item.icon
                        size={17}
                        strokeWidth={1.75}
                        className={isActive ? 'text-[#D6BC86]' : 'text-[#77736D]'}
                      />
                      <span className="text-xs tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[rgba(214,188,134,0.1)]">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.08)]">
                  <ShieldCheck size={14} className="text-[#D6BC86]" strokeWidth={1.75} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[#F5F1E8]">End-to-End Encrypted</span>
                    <span className="text-[9px] text-[#77736D]">Private Client Storage</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-[rgba(214,188,134,0.1)] bg-[#0B0B0D]/90 backdrop-blur-md sticky top-0 z-30">
        {/* Left: Date & Search */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-[#77736D] font-medium">
            <CalendarIcon size={14} className="text-[#D6BC86]" strokeWidth={1.75} />
            <span>{currentDateFormatted}</span>
          </div>

          <form onSubmit={handleSearch} className="relative w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736D]" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search transactions, accounts..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-[#121215] border border-[rgba(214,188,134,0.12)] text-xs text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86] transition-colors"
            />
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cloud Sync button */}
          <button
            onClick={() => setShowAuth(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isCloudSynced
                ? 'bg-[#83C9A5]/15 border-[#83C9A5]/30 text-[#83C9A5]'
                : 'bg-[#121215] border-[rgba(214,188,134,0.12)] hover:border-[#D6BC86]/40 text-[#B6B0A5] hover:text-[#F5F1E8]'
            }`}
            title={isCloudSynced ? `Synced as ${user?.email}` : 'Connect Firebase Cloud'}
          >
            {isCloudSynced ? <Cloud size={14} className="text-[#83C9A5]" /> : <CloudOff size={14} className="text-[#D6BC86]" />}
            <span>{isCloudSynced ? 'Cloud Synced' : 'Cloud Sync'}</span>
          </button>

          {/* Voice AI Assistant Button */}
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D6BC86]/15 border border-[#D6BC86]/35 hover:bg-[#D6BC86]/25 text-[#D6BC86] text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-sm"
            title="MoneyMate Voice AI (Hindi, Punjabi, English)"
          >
            <Mic size={14} strokeWidth={2.2} />
            <span>Voice AI</span>
          </button>

          {/* Guide Tour button */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121215] border border-[rgba(214,188,134,0.12)] hover:border-[#D6BC86]/40 text-xs font-medium text-[#B6B0A5] hover:text-[#F5F1E8] transition-all"
            title="Overview Guide"
          >
            <Compass size={13} className="text-[#D6BC86]" strokeWidth={1.75} />
            <span>Product Tour</span>
          </button>

          {/* Desktop Theme toggle with Fluid Kinetic Animation */}
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.14)] hover:border-[#D6BC86]/40 text-[#D6BC86] transition-colors shadow-sm"
            aria-label="Toggle theme"
            title={settings.theme === 'dark' ? 'Switch to Ivory Light Theme' : 'Switch to Obsidian Dark Theme'}
          >
            {settings.theme === 'dark' ? (
              <Moon size={16} strokeWidth={2} className="text-[#D6BC86]" />
            ) : (
              <Sun size={16} strokeWidth={2} className="text-[#E5A93C]" />
            )}
          </motion.button>

          {/* Notifications */}
          <button 
            className="p-1.5 rounded-lg hover:bg-[#121215] text-[#77736D] hover:text-[#B6B0A5] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D6BC86] rounded-full" />
          </button>

          {/* Profile */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#121215] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#17171B] border border-[rgba(214,188,134,0.25)] flex items-center justify-center text-xs font-semibold text-[#D6BC86]">
              {settings.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[#F5F1E8]">{settings.name}</span>
            <ChevronDown size={12} className="text-[#77736D]" />
          </button>
        </div>
      </header>

      <OnboardingTourModal isOpen={showTour} onClose={() => setShowTour(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <VoiceAssistantModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
    </>
  );
};
