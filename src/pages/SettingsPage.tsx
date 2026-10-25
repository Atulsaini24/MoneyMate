import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, DollarSign, Sparkles, Moon, Sun, 
  Download, Upload, Check, Settings,
  Calendar, Compass, Crown, Cloud, CloudCheck, ShieldCheck,
  Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MoreSettings } from '@/components/settings/MoreSettings';
import { useAuth } from '@/context/AuthContext';
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
    settings, updateSettings, exportData, importData, togglePrivacy, 
    showToast, isCloudSynced 
  } = useApp();
  const { user } = useAuth();

  const [name, setName] = useState(settings.name);
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
          <div className="p-2 rounded-xl bg-mm-gold/15 text-mm-gold border border-mm-gold/30">
            <Settings size={20} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-mm-text tracking-tight">
            Settings & Architecture
          </h1>
        </div>
        <p className="text-xs text-mm-muted mt-1">Profile, appearance, currency and your data</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-4 text-mm-gold">
          <User size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mm-text2">Investor Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-mm-elevated border border-mm-line/24 flex items-center justify-center text-xl font-medium text-mm-gold flex-shrink-0">
              {settings.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-xs font-medium text-mm-text2">Account Holder Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text focus:outline-none focus:border-mm-gold/50 placeholder:text-mm-muted"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
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
        className="glass-card p-6 specular-sheen border border-mm-gold/30 bg-gradient-to-br from-mm-bg2 to-[#18181D]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-mm-gold">
            <Cloud size={18} />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mm-text2">Account & sync</h2>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border ${
            user 
              ? 'bg-mm-positive/10 text-mm-positive border-mm-positive/30' 
              : 'bg-mm-gold/10 text-mm-gold border-mm-gold/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-mm-positive animate-pulse' : 'bg-mm-gold'}`} />
            {user ? (isCloudSynced ? 'Connected & Live' : 'Cloud Connected') : 'Local Storage Mode'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-mm-bg/70 border border-mm-line/14">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-mm-text">
                {user ? (user.displayName || user.email || 'Signed in') : 'Not signed in'}
              </span>
              {user && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mm-gold/15 text-mm-gold border border-mm-gold/25">
                  FIREBASE AUTH
                </span>
              )}
            </div>
            <p className="text-xs text-mm-muted">
              {user 
                ? `Synchronizing transactions, monthly budgets, savings goals & debts to Firebase Firestore.`
                : `Transactions and budgets are stored locally on this device. Sign in with Firebase to enable real-time cross-device sync.`}
            </p>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2"
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
        <div className="flex items-center gap-2 mb-1 text-mm-gold">
          <DollarSign size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mm-text2">Currency & Capital Standards</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency selection */}
          <div>
            <label className="block text-xs font-medium text-mm-muted mb-1.5">Primary Valuation Currency</label>
            <select
              value={settings.currency}
              onChange={e => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text focus:outline-none focus:border-mm-gold/50 [color-scheme:dark]"
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
            <label className="block text-xs font-medium text-mm-muted mb-1.5">Monthly Cycle Anchor Day</label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-mm-muted" />
              <select
                value={settings.budgetStartDay || 1}
                onChange={e => updateSettings({ budgetStartDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text focus:outline-none focus:border-mm-gold/50 [color-scheme:dark]"
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
        <div className="flex items-center gap-2 mb-1 text-mm-gold">
          <Sparkles size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mm-text2">Appearance</h2>
        </div>

        <div className="space-y-3">
          {/* Theme */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-mm-bg2 border border-mm-line/12">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-mm-gold/15 text-mm-gold">
                {settings.theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <div>
                <p className="text-sm font-medium text-mm-text">Obsidian & Champagne Luxury Theme</p>
                <p className="text-xs text-mm-muted">Matte obsidian titanium with restrained champagne gold details</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }, { silent: true })}
              role="switch"
              aria-checked={settings.theme === 'dark'}
              aria-label="Dark theme"
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.theme === 'dark' ? 'bg-mm-gold' : 'bg-mm-elevated border border-mm-line/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.theme === 'dark' ? 'bg-mm-bg translate-x-5' : 'bg-mm-muted translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-mm-bg2 border border-mm-line/12">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-mm-gold/15 text-mm-gold">
                <Sparkles size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-mm-text">Animations</p>
                <p className="text-xs text-mm-muted">Turn off to reduce movement across the app</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              role="switch"
              aria-checked={!settings.reducedMotion}
              aria-label="Animations"
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                !settings.reducedMotion ? 'bg-mm-gold' : 'bg-mm-elevated border border-mm-line/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  !settings.reducedMotion ? 'bg-mm-bg translate-x-5' : 'bg-mm-muted translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-mm-gold/15 text-mm-gold">
                {settings.privacyMode ? <EyeOff size={17} /> : <Eye size={17} />}
              </div>
              <div>
                <p className="text-sm font-medium text-mm-text">Hide amounts</p>
                <p className="text-xs text-mm-muted">Masks every balance on screen. Press H anywhere to toggle.</p>
              </div>
            </div>
            <button
              onClick={togglePrivacy}
              role="switch"
              aria-checked={Boolean(settings.privacyMode)}
              aria-label="Hide amounts"
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                settings.privacyMode ? 'bg-mm-gold' : 'bg-mm-elevated border border-mm-line/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full transition-transform ${settings.privacyMode ? 'bg-mm-bg translate-x-5' : 'bg-mm-muted translate-x-0'}`} />
            </button>
          </div>
        </div>
      </motion.div>

      <MoreSettings />

      {/* Keyboard shortcuts */}
      <div className="glass-card p-6 hidden md:block">
        <h2 className="text-sm font-semibold text-mm-text mb-3">Keyboard shortcuts</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          {[
            ['Search and commands', '⌘ K  /  Ctrl K'],
            ['Add expense', 'N'],
            ['Add income', 'I'],
            ['Hide or show amounts', 'H'],
            ['Quick search', '/'],
          ].map(([label, keys]) => (
            <div key={label} className="flex items-center justify-between border-b border-mm-line/8 pb-2">
              <dt className="text-mm-text2">{label}</dt>
              <dd><kbd className="text-xs text-mm-muted border border-mm-line/20 rounded px-2 py-0.5 font-sans">{keys}</kbd></dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Backup & Export Data */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card p-6 space-y-4 specular-sheen"
      >
        <div className="flex items-center gap-2 mb-1 text-mm-gold">
          <Download size={17} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mm-text2">Backup & export</h2>
        </div>

        <p className="text-xs text-mm-muted leading-relaxed">
          Your personal finance ledger is completely client-side and saved locally in browser storage. You can export or restore a backup at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export button */}
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-mm-text hover:text-mm-gold hover:border-mm-gold/40 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Download size={15} />
            Export Ledger JSON
          </button>

          {/* Import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-mm-text hover:text-mm-gold hover:border-mm-gold/40 text-xs font-medium transition-all shadow-sm active:scale-95"
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
        <h3 className="text-xl font-bold text-mm-text font-serif tracking-tight">MoneyMate Sovereign</h3>
        <p className="text-xs text-mm-gold font-semibold uppercase tracking-widest mt-1">Private Wealth Management</p>
        <p className="text-xs text-mm-text2 mt-2 max-w-md mx-auto leading-relaxed">
          Crafted with an obsidian and champagne luxury aesthetic, tabular typography, and private wealth financial management.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <Compass size={15} />
            Launch Wealth Guide
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-mm-line/10 flex items-center justify-center gap-4 text-[11px] text-mm-muted">
          <span>v2.2 Obsidian</span>
          <span>•</span>
          <span>Zero Server Telemetry</span>
          <span>•</span>
          <span>100% Client Sovereign</span>
        </div>
      </motion.div>



      {/* Feature Guide Tour Modal */}
      <OnboardingTourModal isOpen={showTour} onClose={() => setShowTour(false)} />

      {/* Firebase Cloud Sync & Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

