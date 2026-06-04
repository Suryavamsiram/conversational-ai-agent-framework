import { AppProvider, useApp } from './state/AppContext';
import AuthGuard from './components/AuthGuard';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import AgentConsole from './views/AgentConsole';
import DeveloperPortal from './views/DeveloperPortal';
import AnalyticsTelemetry from './views/AnalyticsTelemetry';
import BillingSubscriptions from './views/BillingSubscriptions';
import { Radio } from 'lucide-react';

function AppContent() {
  const { activeView, auth } = useApp();

  const viewTitle: Record<string, string> = {
    console: 'Agent Console',
    developer: 'Developer Portal',
    analytics: 'Analytics & Telemetry',
    billing: 'Billing & Subscriptions',
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
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

          {/* View Content */}
          <main className="flex-1 overflow-hidden">
            {activeView === 'console' && <AgentConsole />}
            {activeView === 'developer' && <DeveloperPortal />}
            {activeView === 'analytics' && <AnalyticsTelemetry />}
            {activeView === 'billing' && <BillingSubscriptions />}
          </main>
        </div>
      </div>
      <ToastContainer />
    </AuthGuard>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
