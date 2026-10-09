import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { OpportunitiesProvider } from './context/OpportunitiesContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage';
import { OutreachPage } from './pages/OutreachPage';
import { PipelinePage } from './pages/PipelinePage';
import { MeetingsPage } from './pages/MeetingsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';

import { FloatingAiAgent } from './components/FloatingAiAgent';

import './index.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main-layout">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="app-content-area">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>

      <FloatingAiAgent />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <OpportunitiesProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/opportunity/:id" element={<OpportunityDetailPage />} />
            <Route path="/outreach" element={<OutreachPage />} />
            <Route path="/outreach/:id" element={<OutreachPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OpportunitiesProvider>
  );
}

