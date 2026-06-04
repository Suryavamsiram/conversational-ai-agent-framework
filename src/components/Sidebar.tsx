import { useApp } from '../state/AppContext';
import type { AppView } from '../types';
import { Radio, Code as Code2, ChartBar as BarChart3, CreditCard, LogOut, ChevronDown, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const NAV_ITEMS: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'console', label: 'Agent Console', icon: Radio },
  { view: 'developer', label: 'Developer Portal', icon: Code2 },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'billing', label: 'Billing', icon: CreditCard },
];

export default function Sidebar() {
  const { auth, activeView, setActiveView, switchOrg, signOut } = useApp();
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOrgPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!auth.currentOrg) return null;

  return (
    <aside className="w-64 min-h-screen bg-slate-900/90 border-r border-slate-700/40 flex flex-col shrink-0">
      {/* Org Picker */}
      <div className="p-4 border-b border-slate-700/40" ref={pickerRef}>
        <button
          onClick={() => setOrgPickerOpen(!orgPickerOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">
              {auth.currentOrg.name}
            </div>
            <div className="text-xs text-slate-500 capitalize">{auth.currentOrg.tier} tier</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${orgPickerOpen ? 'rotate-180' : ''}`} />
        </button>
        {orgPickerOpen && (
          <div className="mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl py-1 animate-fade-in-up">
            {auth.availableOrgs.map(org => (
              <button
                key={org.id}
                onClick={() => { switchOrg(org.id); setOrgPickerOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/60 transition-colors ${
                  org.id === auth.currentOrg?.id ? 'bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{org.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{org.tier} &middot; {org.memberCount} members</div>
                </div>
                {org.id === auth.currentOrg?.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeView === view
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="p-4 border-t border-slate-700/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
            {auth.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200 truncate">{auth.user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{auth.user?.email}</div>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {auth.user?.role}
          </span>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
