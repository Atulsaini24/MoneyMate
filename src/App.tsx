import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { UIProvider, useUI } from '@/context/UIContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { ToastContainer } from '@/components/shared/Toast';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ReceiptScanner } from '@/components/shared/ReceiptScanner';
import { VoiceAssistantModal } from '@/components/shared/VoiceAssistantModal';
import { UnlockScreen } from '@/components/shared/UnlockScreen';
import { BootSplash, RouteSkeleton } from '@/components/shared/Skeletons';
import { DashboardPage } from '@/pages/DashboardPage';
import { useResolvedTheme } from '@/lib/theme';
import { titleFor, NAV_ITEMS, isActive } from '@/components/layout/nav';
import { PullToRefresh } from '@/components/layout/PullToRefresh';
import { useSpotlight } from '@/components/motion';
import { PaymentSuccess } from '@/components/shared/PaymentSuccess';
import { CustomCursor } from '@/components/shared/CustomCursor';
import { setSoundEnabled } from '@/lib/sound';
import { setCelebrationsEnabled } from '@/lib/celebrate';

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

const THEME_COLOR = { light: '#F3F5F2', dark: '#0C1311' };

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = pathname === '/' ? 'MoneyMate' : `${titleFor(pathname)} · MoneyMate`;
  }, [pathname]);
  return null;
}

/** Theme, accent, privacy and motion live on <html> so portals inherit them. */
function useDocumentSettings() {
  const { settings } = useApp();
  const theme = useResolvedTheme(settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('privacy', Boolean(settings.privacyMode));
    root.classList.toggle('reduce-motion', Boolean(settings.reducedMotion));
    if (settings.accent && settings.accent !== 'peacock') root.dataset.accent = settings.accent;
    else delete root.dataset.accent;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme, settings.privacyMode, settings.reducedMotion, settings.accent]);
  useEffect(() => { setSoundEnabled(settings.sounds !== false); }, [settings.sounds]);
  useEffect(() => { setCelebrationsEnabled(settings.celebrations !== false); }, [settings.celebrations]);
}

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user, guest, loading } = useAuth();
  const { locked } = useApp();
  const { recap, voiceOpen, setVoiceOpen } = useUI();
  useDocumentSettings();
  useSpotlight();
  // Slide in from the side the tab sits on: right for later tabs, left for earlier ones
  const order = NAV_ITEMS.findIndex(i => isActive(location.pathname, i.to));
  const prevOrder = useRef(order);
  const dir = order === prevOrder.current ? 0 : order > prevOrder.current ? 1 : -1;
  useEffect(() => { prevOrder.current = order; }, [order]);

  if (loading) return <BootSplash label="Opening your account" />;

  if (!user && !guest) {
    return (
      <Suspense fallback={<BootSplash />}>
        <LoginPage />
        <ToastContainer />
      </Suspense>
    );
  }

  if (locked) return <UnlockScreen />;

  return (
    <div className="flex min-h-dvh text-mm-text">
      <div className="aurora" aria-hidden><i /><i /><i /></div>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-mm-accent focus:text-mm-on-accent">
        Skip to content
      </a>
      <AppSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main id="main" className="flex-1">
          <motion.div key={location.pathname} initial={{ opacity: 0, x: dir * 28, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none', transform: 'none' } }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
            <Suspense fallback={<RouteSkeleton pathname={location.pathname} />}>
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
        </main>
        <MobileBottomNavigation />
        <PullToRefresh />
      </div>

      {recap && <Suspense fallback={null}><RecapStory /></Suspense>}
      <CommandPalette />
      <ReceiptScanner />
      <VoiceAssistantModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <ToastContainer />
      <PaymentSuccess />
    </div>
  );
};

const Shell: React.FC = () => {
  const { settings, togglePrivacy } = useApp();
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      <BrowserRouter>
        <UIProvider onTogglePrivacy={togglePrivacy}>
          <RouteEffects />
          <AppLayout />
          <CustomCursor key={settings.reducedMotion ? 'still' : 'live'} />
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
