import { useState } from 'react';
import { useApp } from '../state/AppContext';
import type { ApiKey } from '../types';
import { Key, Plus, Copy, Trash2, X, Check, Shield, Eye } from 'lucide-react';

function GenerateKeyModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (name: string, scope: 'full' | 'read' | 'write') => Promise<ApiKey> }) {
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState<'full' | 'read' | 'write'>('full');
  const [generated, setGenerated] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!keyName.trim()) return;
    setGenerating(true);
    const key = await onGenerate(keyName, scope);
    setGenerated(key);
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6 shadow-2xl shadow-black/40 border-orange-500/15" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-100">Generate New API Key</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!generated ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Key Name</label>
              <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)}
                placeholder="e.g., Production API"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 text-sm" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Scope</label>
              <div className="grid grid-cols-3 gap-2">
                {(['full', 'read', 'write'] as const).map(s => (
                  <button key={s} onClick={() => setScope(s)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      scope === s ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 inner-glow-orange' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                    }`}>
                    {s === 'full' ? 'Full Access' : s === 'read' ? 'Read Only' : 'Write Only'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={!keyName.trim() || generating}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-orange-600/20">
              {generating ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 mb-2 font-medium">API Key Generated</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-emerald-300 text-sm font-mono overflow-x-auto">{generated.key}</code>
                <button onClick={handleCopy} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-all shrink-0">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-amber-400/80 mt-2">Copy this key now. It will not be shown again.</p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-all text-sm border border-white/10">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeveloperPortal() {
  const { apiKeys, generateApiKey, revokeApiKey, auth } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const activeKeys = apiKeys.filter(k => k.status === 'active');
  const revokedKeys = apiKeys.filter(k => k.status === 'revoked');
  const isDevTier = auth.currentOrg?.tier === 'developer';

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const maskKey = (key: string) => key.substring(0, 12) + '...';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 mb-1">Developer Portal</h1>
            <p className="text-sm text-slate-500">Manage organization-scoped API credentials</p>
          </div>
          <button onClick={() => !isDevTier && setModalOpen(true)} disabled={isDevTier}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDevTier ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/[0.04]'
              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'}`}>
            <Plus className="w-4 h-4" /> Generate New API Key
          </button>
        </div>

        {isDevTier && (
          <div className="mb-6 p-4 rounded-xl glass-card border-amber-400/20 text-amber-300 text-sm inner-glow-orange">
            <div className="flex items-center gap-2 mb-1 font-medium"><Shield className="w-4 h-4" />API Key Generation Locked</div>
            <p className="text-amber-400/70">Upgrade to Scale Business or Enterprise tier to generate custom API keys.</p>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-slate-200">Active Keys</span>
            <span className="text-xs text-slate-600 ml-1">({activeKeys.length})</span>
          </div>
          {activeKeys.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm">No active API keys</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left px-5 py-2.5 font-medium">Name</th>
                  <th className="text-left px-5 py-2.5 font-medium">Key</th>
                  <th className="text-left px-5 py-2.5 font-medium">Scope</th>
                  <th className="text-left px-5 py-2.5 font-medium">Created</th>
                  <th className="text-right px-5 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeKeys.map(key => (
                  <tr key={key.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-200 font-medium">{key.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-400 font-mono">{revealedKeys.has(key.id) ? key.key : maskKey(key.key)}</code>
                        <button onClick={() => toggleReveal(key.id)} className="text-slate-600 hover:text-slate-400 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        key.scope === 'full' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        key.scope === 'read' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>{key.scope}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => revokeApiKey(key.id, key.name)} className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/5"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {revokedKeys.length > 0 && (
          <div className="mt-6 glass-card-sm overflow-hidden opacity-50">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Revoked Keys</span>
              <span className="text-xs text-slate-600 ml-1">({revokedKeys.length})</span>
            </div>
            <table className="w-full">
              <tbody>
                {revokedKeys.map(key => (
                  <tr key={key.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-2.5 text-sm text-slate-500">{key.name}</td>
                    <td className="px-5 py-2.5 text-xs text-slate-600 font-mono">{maskKey(key.key)}</td>
                    <td className="px-5 py-2.5 text-xs text-red-400/50">Revoked</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && <GenerateKeyModal onClose={() => setModalOpen(false)} onGenerate={generateApiKey} />}
    </div>
  );
}
