import { useState } from 'react';
import { useApp } from '../state/AppContext';
import type { AgentConfig, WebhookCallback } from '../types';
import { Bot, Plus, Save, Power, PowerOff, FileSliders as Sliders, MessageSquare, Thermometer, Volume2, Globe, X, ChevronDown, ChevronRight } from 'lucide-react';

const EMPTY_AGENT: AgentConfig = {
  id: '',
  name: '',
  description: '',
  systemPrompt: '',
  modelTemperature: 0.5,
  modelTopP: 0.9,
  maxTokenCap: 4096,
  voicePitch: 1.0,
  voiceSpeed: 1.0,
  voiceGender: 'neutral',
  isActive: false,
  createdAt: new Date().toISOString(),
};

function AgentEditor({ agent, onSave, onClose }: {
  agent: AgentConfig;
  onSave: (a: AgentConfig) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AgentConfig>({ ...agent, id: agent.id || `agent-${Math.random().toString(36).substring(2, 8)}` });
  const [webhooks, setWebhooks] = useState<WebhookCallback[]>([
    { id: 'wh-1', label: 'Transcription Callback', url: '', event: 'on_transcription', isActive: true },
    { id: 'wh-2', label: 'Response Callback', url: '', event: 'on_response', isActive: false },
  ]);

  const updateField = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{agent.id ? 'Edit Agent' : 'New Agent'}</h2>
            <p className="text-xs text-slate-500">Configure behavioral matrix and voice engine</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <section className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Basic Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Agent Name</label>
              <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                placeholder="e.g., Customer Support Agent"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <input type="text" value={form.description} onChange={e => updateField('description', e.target.value)}
                placeholder="Brief description of this agent's purpose"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">System Prompt</label>
              <textarea value={form.systemPrompt} onChange={e => updateField('systemPrompt', e.target.value)}
                placeholder="You are a helpful agent that..."
                rows={5}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-mono leading-relaxed resize-y" />
            </div>
          </div>
        </section>

        {/* Model Parameters */}
        <section className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" /> Model Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Temperature</label>
              <input type="range" min="0" max="2" step="0.1" value={form.modelTemperature}
                onChange={e => updateField('modelTemperature', parseFloat(e.target.value))}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Precise (0)</span>
                <span className="text-amber-400 font-mono">{form.modelTemperature.toFixed(1)}</span>
                <span>Creative (2)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Top-P</label>
              <input type="range" min="0" max="1" step="0.05" value={form.modelTopP}
                onChange={e => updateField('modelTopP', parseFloat(e.target.value))}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Narrow (0)</span>
                <span className="text-amber-400 font-mono">{form.modelTopP.toFixed(2)}</span>
                <span>Broad (1)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Token Cap</label>
              <input type="number" value={form.maxTokenCap} onChange={e => updateField('maxTokenCap', parseInt(e.target.value) || 0)}
                min={256} max={32768} step={256}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-mono" />
            </div>
          </div>
        </section>

        {/* Voice Engine */}
        <section className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" /> Voice Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender Profile</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'neutral'] as const).map(g => (
                  <button key={g} onClick={() => updateField('voiceGender', g)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border capitalize ${
                      form.voiceGender === g
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:border-slate-600'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Pitch</label>
              <input type="range" min="0.5" max="2" step="0.1" value={form.voicePitch}
                onChange={e => updateField('voicePitch', parseFloat(e.target.value))}
                className="w-full accent-emerald-500" />
              <div className="text-center text-xs text-emerald-400 font-mono mt-1">{form.voicePitch.toFixed(1)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Speed</label>
              <input type="range" min="0.5" max="2" step="0.1" value={form.voiceSpeed}
                onChange={e => updateField('voiceSpeed', parseFloat(e.target.value))}
                className="w-full accent-emerald-500" />
              <div className="text-center text-xs text-emerald-400 font-mono mt-1">{form.voiceSpeed.toFixed(1)}</div>
            </div>
          </div>
        </section>

        {/* Webhook Callbacks */}
        <section className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" /> Custom Webhook Callbacks
          </h3>
          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="flex items-center gap-3">
                <select value={wh.event} onChange={e => setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, event: e.target.value as WebhookCallback['event'] } : w))}
                  className="px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="on_transcription">on_transcription</option>
                  <option value="on_response">on_response</option>
                  <option value="on_error">on_error</option>
                  <option value="on_disconnect">on_disconnect</option>
                </select>
                <input type="text" value={wh.url} onChange={e => setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, url: e.target.value } : w))}
                  placeholder="https://your-server.com/webhook"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                <button onClick={() => setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, isActive: !w.isActive } : w))}
                  className={`p-2 rounded-lg transition-all ${wh.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={() => setWebhooks(prev => [...prev, { id: `wh-${generateId()}`, label: '', url: '', event: 'on_transcription', isActive: true }])}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end gap-3 pb-6">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm border border-slate-700/50">
            Cancel
          </button>
          <button onClick={() => { onSave(form); onClose(); }}
            disabled={!form.name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-indigo-600/20">
            <Save className="w-4 h-4" /> Save Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export default function AgentConfiguration() {
  const { agents, saveAgent, toggleAgentActive } = useApp();
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (editingAgent !== null) {
    return <AgentEditor agent={editingAgent} onSave={saveAgent} onClose={() => setEditingAgent(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 mb-1">Agent Configuration Matrix</h1>
            <p className="text-sm text-slate-500">Define behavioral profiles, voice engines, and webhook routing</p>
          </div>
          <button
            onClick={() => setEditingAgent({ ...EMPTY_AGENT })}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Agent
          </button>
        </div>

        {/* Agent List */}
        <div className="space-y-3">
          {agents.map(agent => (
            <div key={agent.id} className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
              {/* Agent Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <button onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  {expandedId === agent.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  agent.isActive ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-slate-800 border border-slate-700/50'
                }`}>
                  <Bot className={`w-4 h-4 ${agent.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{agent.name}</div>
                  <div className="text-xs text-slate-500 truncate">{agent.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                    agent.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                  }`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleAgentActive(agent.id)}
                    className={`p-2 rounded-lg transition-all ${agent.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'}`}>
                    {agent.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditingAgent(agent)}
                    className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === agent.id && (
                <div className="px-5 pb-4 pt-0 border-t border-slate-700/30 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                    <div className="text-xs">
                      <span className="text-slate-500">Temperature</span>
                      <span className="ml-2 text-amber-400 font-mono">{agent.modelTemperature}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Top-P</span>
                      <span className="ml-2 text-amber-400 font-mono">{agent.modelTopP}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Max Tokens</span>
                      <span className="ml-2 text-amber-400 font-mono">{agent.maxTokenCap}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Voice</span>
                      <span className="ml-2 text-emerald-400 font-mono capitalize">{agent.voiceGender} P{agent.voicePitch} S{agent.voiceSpeed}</span>
                    </div>
                  </div>
                  {agent.systemPrompt && (
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">System Prompt</p>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{agent.systemPrompt}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
