import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, DollarSign, Sparkles, Moon, Sun, 
  RotateCcw, Download, Upload, Check, Settings,
  Calendar, Compass, Crown, Cloud, CloudCheck, ShieldCheck 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { OnboardingTourModal } from '@/components/shared/OnboardingTourModal';
import { AuthModal } from '@/components/shared/AuthModal';
import { MoneyMateLogo } from '@/components/shared/MoneyMateLogo';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
];

export const SettingsPage: React.FC = () => {
  const { 
    settings, updateSettings, exportData, importData, 
    resetData, showToast, isCloudSynced 
  } = useApp();
  const { user } = useAuth();

  const [name, setName] = useState(settings.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateSettings({ name: name.trim() });
    showToast('Profile credentials saved', 'success');
  };

  const handleCurrencyChange = (currCode: string) => {
    const found = CURRENCIES.find(c => c.code === currCode);
    if (found) {
      updateSettings({ currency: found.code, currencySymbol: found.symbol });
      showToast(`Valuation currency set to ${found.name}`, 'info');
    }
  };

  const handleExportData = () => {
    try {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moneymate-ledger-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Ledger export completed', 'success');
    } catch {
      showToast('Failed to export ledger', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const ok = importData(json);
        if (ok) {
          showToast('Ledger restored successfully', 'success');
        } else {
          showToast('Invalid ledger backup format', 'error');
        }
      } catch {
        showToast('Error reading ledger backup file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-8 max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30">
            <Settings size={20} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#F5F1E8] tracking-tight">
            Settings & Architecture
          </h1>
        </div>
        <p className="text-xs text-[#77736D] mt-1">Manage wealth credentials, luxury aesthetics, and regional currency</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-4 text-[#D6BC86]">
          <User size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#B6B0A5]">Investor Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#19191D] border border-[rgba(214,188,134,0.24)] flex items-center justify-center text-xl font-medium text-[#D6BC86] flex-shrink-0">
              {settings.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-xs font-medium text-[#B6B0A5]">Account Holder Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 placeholder:text-[#77736D]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Firebase Cloud Sync & Database Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="glass-card p-6 specular-sheen border border-[#D6BC86]/30 bg-gradient-to-br from-[#121215] to-[#18181D]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#D6BC86]">
            <Cloud size={18} />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#B6B0A5]">Firebase Cloud Vault & Sync</h2>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border ${
            user 
              ? 'bg-[#82D9A3]/10 text-[#82D9A3] border-[#82D9A3]/30' 
              : 'bg-[#D6BC86]/10 text-[#D6BC86] border-[#D6BC86]/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-[#82D9A3] animate-pulse' : 'bg-[#D6BC86]'}`} />
            {user ? (isCloudSynced ? 'Connected & Live' : 'Cloud Connected') : 'Local Storage Mode'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B0B0D]/70 border border-[rgba(214,188,134,0.14)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F5F1E8]">
                {user ? (user.displayName || user.email || 'Cloud Investor') : 'Local Offline Vault'}
              </span>
              {user && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/25">
                  FIREBASE AUTH
                </span>
              )}
            </div>
            <p className="text-xs text-[#77736D]">
              {user 
                ? `Synchronizing transactions, monthly budgets, savings goals & debts to Firebase Firestore.`
                : `Transactions and budgets are stored locally on this device. Sign in with Firebase to enable real-time cross-device sync.`}
            </p>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Cloud size={14} />
            {user ? 'Manage Cloud Sync' : 'Connect Cloud Vault'}
          </button>
        </div>
      </motion.div>

      {/* Currency & Financial Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="glass-card p-6 space-y-4 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-1 text-[#D6BC86]">
          <DollarSign size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#B6B0A5]">Currency & Capital Standards</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency selection */}
          <div>
            <label className="block text-xs font-medium text-[#77736D] mb-1.5">Primary Valuation Currency</label>
            <select
              value={settings.currency}
              onChange={e => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 [color-scheme:dark]"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget start day */}
          <div>
            <label className="block text-xs font-medium text-[#77736D] mb-1.5">Monthly Cycle Anchor Day</label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#77736D]" />
              <select
                value={settings.budgetStartDay || 1}
                onChange={e => updateSettings({ budgetStartDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 [color-scheme:dark]"
              >
                {[1, 5, 10, 15, 20, 25, 28].map(day => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st of the month (Standard)' : `${day}th of each month`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* App Appearance & Behaviour */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card p-6 space-y-4 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-1 text-[#D6BC86]">
          <Sparkles size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#B6B0A5]">Display & Motion Aesthetics</h2>
        </div>

        <div className="space-y-3">
          {/* Theme */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.12)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D6BC86]/15 text-[#D6BC86]">
                {settings.theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F1E8]">Obsidian & Champagne Luxury Theme</p>
                <p className="text-xs text-[#77736D]">Matte obsidian titanium with restrained champagne gold details</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.theme === 'dark' ? 'bg-[#D6BC86]' : 'bg-[#19191D] border border-[rgba(214,188,134,0.2)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.theme === 'dark' ? 'bg-[#0B0B0D] translate-x-5' : 'bg-[#77736D] translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.12)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D6BC86]/15 text-[#D6BC86]">
                <Sparkles size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F1E8]">Fluid Kinetic Animations</p>
                <p className="text-xs text-[#77736D]">Subtle 200ms spring transitions and refined progress feedback</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                !settings.reducedMotion ? 'bg-[#D6BC86]' : 'bg-[#19191D] border border-[rgba(214,188,134,0.2)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  !settings.reducedMotion ? 'bg-[#0B0B0D] translate-x-5' : 'bg-[#77736D] translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Backup & Export Data */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card p-6 space-y-4 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-1 text-[#D6BC86]">
          <Download size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#B6B0A5]">Data Sovereignty & Vault</h2>
        </div>

        <p className="text-xs text-[#77736D] leading-relaxed">
          Your personal finance ledger is completely client-side and saved locally in browser storage. You can export or restore a backup at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export button */}
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-[#F5F1E8] hover:text-[#D6BC86] hover:border-[#D6BC86]/40 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Download size={15} />
            Export Ledger JSON
          </button>

          {/* Import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-[#F5F1E8] hover:text-[#D6BC86] hover:border-[#D6BC86]/40 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Upload size={15} />
            Restore Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          {/* Reset button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D98282]/10 border border-[#D98282]/20 text-[#D98282] hover:bg-[#D98282]/20 text-xs font-medium transition-all active:scale-95"
          >
            <RotateCcw size={15} />
            Reset Demo Data
          </button>
        </div>
      </motion.div>

      {/* About MoneyMate Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="glass-card-elevated p-8 text-center relative overflow-hidden specular-sheen"
      >
        <div className="flex justify-center mb-4">
          <MoneyMateLogo size={52} showText={false} />
        </div>
        <h3 className="text-xl font-bold text-[#F5F1E8] font-serif tracking-tight">MoneyMate Sovereign</h3>
        <p className="text-xs text-[#D6BC86] font-semibold uppercase tracking-widest mt-1">Private Wealth Management</p>
        <p className="text-xs text-[#B6B0A5] mt-2 max-w-md mx-auto leading-relaxed">
          Crafted with an obsidian and champagne luxury aesthetic, tabular typography, and private wealth financial management.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <Compass size={15} />
            Launch Wealth Guide
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[rgba(214,188,134,0.1)] flex items-center justify-center gap-4 text-[11px] text-[#77736D]">
          <span>v2.2 Obsidian</span>
          <span>•</span>
          <span>Zero Server Telemetry</span>
          <span>•</span>
          <span>100% Client Sovereign</span>
        </div>
      </motion.div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetData();
          setShowResetConfirm(false);
        }}
        title="Reset All Data"
        description="Are you sure you want to restore the default sample data? All newly added transactions, budgets, goals, and friend records will be replaced with initial demo records."
        variant="danger"
      />

      {/* Feature Guide Tour Modal */}
      <OnboardingTourModal isOpen={showTour} onClose={() => setShowTour(false)} />

      {/* Firebase Cloud Sync & Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

