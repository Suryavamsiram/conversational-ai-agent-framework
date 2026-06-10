import { useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import AgentConsole from './views/AgentConsole';
import DeveloperPortal from './views/DeveloperPortal';
import AnalyticsTelemetry from './views/AnalyticsTelemetry';
import AgentConfiguration from './views/AgentConfiguration';
import PhoneRouting from './views/PhoneRouting';
import BillingSubscriptions from './views/BillingSubscriptions';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthGuard from './components/AuthGuard';
import { Radio, Loader as Loader2 } from 'lucide-react';

type PublicPage = 'landing' | 'onboarding' | 'signin';

function DashboardContent() {
  const { activeView, auth } = useApp();

  const viewTitle: Record<string, string> = {
    console: 'Agent Console',
    developer: 'Developer Portal',
    analytics: 'Analytics & Telemetry',
    agents: 'Agent Configuration',
    routing: 'Phone Routing',
    billing: 'Billing & Subscriptions',
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700/40 bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">{viewTitle[activeView]}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Org: {auth.currentOrg?.name}</span>
            <span className="w-px h-4 bg-slate-700" />
            <span className="capitalize">{auth.currentOrg?.tier}</span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeView === 'console' && <AgentConsole />}
          {activeView === 'developer' && <DeveloperPortal />}
          {activeView === 'analytics' && <AnalyticsTelemetry />}
          {activeView === 'agents' && <AgentConfiguration />}
          {activeView === 'routing' && <PhoneRouting />}
          {activeView === 'billing' && <BillingSubscriptions />}
        </main>
      </div>
    </div>
  );
}

function AppShell() {
  const { auth, authLoading } = useApp();
  const [publicPage, setPublicPage] = useState<PublicPage>('landing');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  // Authenticated -> dashboard
  if (auth.isAuthenticated) {
    return <DashboardContent />;
  }

  // Unauthenticated -> public pages
  if (publicPage === 'onboarding') {
    return <OnboardingPage onBack={() => setPublicPage('landing')} />;
  }

  if (publicPage === 'signin') {
    return <AuthGuard onBack={() => setPublicPage('landing')} />;
  }

  return <LandingPage onGetStarted={() => setPublicPage('onboarding')} onSignIn={() => setPublicPage('signin')} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
        <ToastContainer />
      </AppProvider>
    </ErrorBoundary>
  );
}
