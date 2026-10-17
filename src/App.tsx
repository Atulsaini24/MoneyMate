import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { ToastContainer } from '@/components/shared/Toast';

// Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { SettingsPage } from '@/pages/SettingsPage';

import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex flex-col items-center justify-center gap-4 text-[#D6BC86]">
        <div className="w-10 h-10 border-2 border-[#D6BC86] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-serif uppercase tracking-widest text-[#B6B0A5]">Opening Secure Vault...</span>
      </div>
    );
  }

  // If user is not authenticated, show luxury split-screen Login & Showcase Page
  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0B0D] text-[#F5F1E8] selection:bg-[#D6BC86]/25 selection:text-[#E9D8AF] antialiased">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Subtle, restrained ambient warmth (Quiet Luxury) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-gradient-to-b from-[#D6BC86]/[0.03] to-transparent blur-[120px]" />
        </div>

        {/* Desktop Sticky Header */}
        <DashboardHeader />

        {/* Page Content with Restrained 200ms Page Transitions */}
        <main className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Routes location={location}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNavigation />
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
