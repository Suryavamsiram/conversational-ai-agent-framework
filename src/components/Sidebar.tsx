import { useApp } from '../state/AppContext';
import type { AppView } from '../types';
import { Radio, Code as Code2, ChartBar as BarChart3, CreditCard, LogOut, ChevronDown, Building2, Bot, Phone } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const NAV_ITEMS: { view: AppView; label: string; icon: React.ElementType; accent: string }[] = [
  { view: 'console', label: 'Agent Console', icon: Radio, accent: 'from-orange-400 to-orange-600' },
  { view: 'developer', label: 'Developer Portal', icon: Code2, accent: 'from-emerald-400 to-emerald-600' },
  { view: 'analytics', label: 'Analytics', icon: BarChart3, accent: 'from-cyan-400 to-cyan-600' },
  { view: 'agents', label: 'Agent Config', icon: Bot, accent: 'from-indigo-400 to-indigo-600' },
  { view: 'routing', label: 'Phone Routing', icon: Phone, accent: 'from-amber-400 to-amber-600' },
  { view: 'billing', label: 'Billing', icon: CreditCard, accent: 'from-teal-400 to-teal-600' },
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
    <aside className="w-64 min-h-screen bg-slate-900/95 border-r border-white/[0.06] flex flex-col shrink-0 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="p-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/25 flex items-center justify-center animate-glow-pulse">
            <Radio className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100 tracking-tight">SwarmVoice</span>
            <span className="text-orange-400 font-bold">.ai</span>
          </div>
        </div>
      </div>

      {/* Org Picker */}
      <div className="p-3 border-b border-white/[0.06]" ref={pickerRef}>
        <button
          onClick={() => setOrgPickerOpen(!orgPickerOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:border-emerald-500/35 transition-colors">
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">
              {auth.currentOrg.name}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">{auth.currentOrg.tier} tier</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${orgPickerOpen ? 'rotate-180' : ''}`} />
        </button>
        {orgPickerOpen && (
          <div className="mt-1 bg-slate-800/90 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 py-1 animate-fade-in-up backdrop-blur-xl">
            {auth.availableOrgs.map(org => (
              <button
                key={org.id}
                onClick={() => { switchOrg(org.id); setOrgPickerOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${
                  org.id === auth.currentOrg?.id ? 'bg-emerald-500/[0.07]' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{org.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{org.tier} &middot; {org.memberCount} members</div>
                </div>
                {org.id === auth.currentOrg?.id && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ view, label, icon: Icon, accent }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group ${
                isActive
                  ? 'bg-white/[0.06] text-slate-100 border border-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b ${accent}`} />
              )}
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-orange-400' : 'group-hover:text-slate-300'}`} />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/15 to-emerald-500/15 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-300">
            {auth.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-200 truncate font-medium">{auth.user?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{auth.user?.email}</div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
            {auth.user?.role}
          </span>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
