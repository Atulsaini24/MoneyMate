import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { UIProvider } from '@/context/UIContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { ToastContainer } from '@/components/shared/Toast';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ReceiptScanner } from '@/components/shared/ReceiptScanner';
import { DashboardPage } from '@/pages/DashboardPage';
import { useUI } from '@/context/UIContext';
import { installSpotlight } from '@/lib/fx';
import { UnlockScreen } from '@/components/shared/UnlockScreen';

// The dashboard ships in the main bundle; everything else loads on demand.
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage').then(m => ({ default: m.BudgetsPage })));
const GoalsPage = lazy(() => import('@/pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const FriendsPage = lazy(() => import('@/pages/FriendsPage').then(m => ({ default: m.FriendsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ImportPage = lazy(() => import('@/pages/ImportPage').then(m => ({ default: m.ImportPage })));
const AskPage = lazy(() => import('@/pages/AskPage').then(m => ({ default: m.AskPage })));
const WealthPage = lazy(() => import('@/pages/WealthPage').then(m => ({ default: m.WealthPage })));
const TaxPage = lazy(() => import('@/pages/TaxPage').then(m => ({ default: m.TaxPage })));
const GroupsPage = lazy(() => import('@/pages/GroupsPage').then(m => ({ default: m.GroupsPage })));
const RecapStory = lazy(() => import('@/components/recap/RecapStory'));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const Splash: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" role="status">
    <div className="w-9 h-9 border-2 border-mm-gold border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-mm-muted">{label}</span>
  </div>
);

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { settings, locked } = useApp();
  const { recap } = useUI();

  useEffect(() => installSpotlight(), []);

  // Theme and privacy live on <html> so portals (modals, palette) inherit them.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', settings.theme === 'light');
    root.classList.toggle('privacy', Boolean(settings.privacyMode));
    root.classList.toggle('reduce-motion', Boolean(settings.reducedMotion));
    root.dataset.accent = settings.accent || 'gold';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'light' ? '#F6F3EC' : '#0B0B0D');
  }, [settings.theme, settings.privacyMode, settings.reducedMotion, settings.accent]);

  if (loading) {
    return <div className="min-h-screen bg-mm-bg flex items-center justify-center"><Splash label="Opening your account" /></div>;
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-mm-bg" />}>
        <LoginPage />
        <ToastContainer />
      </Suspense>
    );
  }

  if (locked) return <UnlockScreen />;

  return (
    <div className="flex min-h-screen bg-mm-bg text-mm-text selection:bg-mm-gold/25 antialiased">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-mm-gold focus:text-mm-on-gold">
        Skip to content
      </a>
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        <div className="mm-ambient" aria-hidden><i /><i /><i /></div>
        <div className="mm-grain" aria-hidden />

        <DashboardHeader />

        <main id="main" className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Suspense fallback={<Splash />}>
                <Routes location={location}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/budgets" element={<BudgetsPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/ask" element={<AskPage />} />
                  <Route path="/wealth" element={<WealthPage />} />
                  <Route path="/tax" element={<TaxPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileBottomNavigation />
      </div>

      {recap && <Suspense fallback={null}><RecapStory /></Suspense>}
      <CommandPalette />
      <ReceiptScanner />
      <ToastContainer />
    </div>
  );
};

const Shell: React.FC = () => {
  const { settings, togglePrivacy } = useApp();
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      <BrowserRouter>
        <UIProvider onTogglePrivacy={togglePrivacy}>
          <ScrollToTop />
          <AppLayout />
        </UIProvider>
      </BrowserRouter>
    </MotionConfig>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppProvider>
      <Shell />
    </AppProvider>
  </AuthProvider>
);

export default App;
