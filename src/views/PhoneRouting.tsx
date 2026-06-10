import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { Phone, Plus, Bot, Link, Unlink, CircleAlert as AlertCircle } from 'lucide-react';

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  AU: '🇦🇺',
  DE: '🇩🇪',
  CA: '🇨🇦',
  JP: '🇯🇵',
};

export default function PhoneRouting() {
  const { phoneRoutes, agents, assignAgentToPhone } = useApp();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const activeRoutes = phoneRoutes.filter(r => r.status === 'active');
  const inactiveRoutes = phoneRoutes.filter(r => r.status !== 'active');

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 mb-1">Phone Routing & Virtual Numbers</h1>
            <p className="text-sm text-slate-500">Manage virtual phone lines and wire them to agent profiles</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Buy Number
          </button>
        </div>

        {/* Active Numbers */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-slate-700/40 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">Active Lines</span>
            <span className="text-xs text-slate-600 ml-1">({activeRoutes.length})</span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
                <th className="text-left px-5 py-2.5 font-medium">Number</th>
                <th className="text-left px-5 py-2.5 font-medium">Country</th>
                <th className="text-left px-5 py-2.5 font-medium">Assigned Agent</th>
                <th className="text-left px-5 py-2.5 font-medium">Minutes Used</th>
                <th className="text-left px-5 py-2.5 font-medium">Monthly Cost</th>
                <th className="text-right px-5 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRoutes.map(route => (
                <tr key={route.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <code className="text-sm text-slate-200 font-mono">{route.phoneNumber}</code>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{COUNTRY_FLAGS[route.country] || ''}</span>
                      <span className="text-sm text-slate-300">{route.country}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {assigningId === route.id ? (
                      <select
                        autoFocus
                        value={route.assignedAgentId || ''}
                        onChange={e => {
                          const agent = agents.find(a => a.id === e.target.value);
                          assignAgentToPhone(route.id, agent?.id || null, agent?.name || null);
                          setAssigningId(null);
                        }}
                        onBlur={() => setAssigningId(null)}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="">-- Unassign --</option>
                        {agents.filter(a => a.isActive).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    ) : route.assignedAgentName ? (
                      <button onClick={() => setAssigningId(route.id)}
                        className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Bot className="w-3.5 h-3.5" />
                        {route.assignedAgentName}
                      </button>
                    ) : (
                      <button onClick={() => setAssigningId(route.id)}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        <Link className="w-3.5 h-3.5" /> Assign Agent
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300 font-mono">{route.minutesUsed.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">${route.monthlyCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => assignAgentToPhone(route.id, null, null)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5">
                      <Unlink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeRoutes.length === 0 && (
            <div className="p-8 text-center text-slate-600 text-sm">No active virtual numbers</div>
          )}
        </div>

        {/* Inactive / Pending Numbers */}
        {inactiveRoutes.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/30 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Inactive / Pending</span>
              <span className="text-xs text-slate-600 ml-1">({inactiveRoutes.length})</span>
            </div>
            <table className="w-full">
              <tbody>
                {inactiveRoutes.map(route => (
                  <tr key={route.id} className="border-b border-slate-800/30 opacity-60 hover:opacity-80 transition-opacity">
                    <td className="px-5 py-2.5 text-sm text-slate-400 font-mono">{route.phoneNumber}</td>
                    <td className="px-5 py-2.5 text-sm text-slate-400">{COUNTRY_FLAGS[route.country] || ''} {route.country}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-md ${
                        route.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-500">${route.monthlyCost.toFixed(2)}/mo</td>
                    <td className="px-5 py-2.5 text-right">
                      {route.status === 'pending' && (
                        <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 ml-auto">
                          <AlertCircle className="w-3.5 h-3.5" /> Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
