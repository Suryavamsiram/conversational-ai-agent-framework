import { useApp } from '../state/AppContext';
import type { VoiceSessionStatus, CallLifecyclePhase } from '../types';
import { Wifi, WifiOff, TriangleAlert as AlertTriangle, Loader as Loader2, Mic, MicOff, OctagonAlert as AlertOctagon, ArrowDownToLine, User, Bot, Brain } from 'lucide-react';
import { useEffect, useRef } from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

const STATUS_CONFIG: Record<VoiceSessionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connecting: { label: 'Connecting', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: Loader2 },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', icon: Wifi },
  interrupted: { label: 'Interrupted', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: AlertTriangle },
  disconnected: { label: 'Disconnected', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30', icon: WifiOff },
};

const PHASE_INDICATOR: Record<CallLifecyclePhase, { label: string; color: string; icon: React.ElementType }> = {
  idle: { label: 'Idle', color: 'text-slate-500', icon: MicOff },
  handshake: { label: 'Handshake', color: 'text-amber-400', icon: Loader2 },
  user_speaking: { label: 'User Speaking', color: 'text-emerald-400', icon: User },
  model_processing: { label: 'Processing', color: 'text-amber-400', icon: Brain },
  agent_speaking: { label: 'Agent Speaking', color: 'text-cyan-400', icon: Bot },
  disconnecting: { label: 'Disconnecting', color: 'text-red-400', icon: WifiOff },
  disconnected: { label: 'Disconnected', color: 'text-slate-500', icon: WifiOff },
};

function TranscriptPanel() {
  const { session } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session.transcripts]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-3 p-4">
      {session.transcripts.length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-600 text-sm">
          Waiting for voice transcription...
        </div>
      )}
      {session.transcripts.map(entry => (
        <div
          key={entry.id}
          className={`animate-fade-in-up rounded-xl p-3.5 text-sm ${
            entry.role === 'user'
              ? 'glass-card-sm border-emerald-500/15 ml-4'
              : 'glass-card-sm border-cyan-500/15 mr-4'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {entry.role === 'user' ? (
              <User className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              entry.role === 'user' ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {entry.role === 'user' ? 'User' : 'Voice Agent'}
            </span>
            <span className="text-[10px] text-slate-600">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {entry.isStreaming && (
              <span className="text-[10px] text-amber-400 animate-blink">streaming...</span>
            )}
          </div>
          <p className={`leading-relaxed ${
            entry.role === 'user' ? 'text-slate-300' : 'text-cyan-200'
          } ${entry.isStreaming ? 'opacity-70' : ''}`}>
            {entry.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function DevConsole() {
  const { session } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session.logs]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
      {session.logs.length === 0 && (
        <div className="text-slate-600">No events yet. Connect to start streaming.</div>
      )}
      {session.logs.map(entry => (
        <div key={entry.id} className="flex gap-2 py-0.5 animate-fade-in-up">
          <span className="text-slate-600 shrink-0">
            {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className={`shrink-0 ${
            entry.direction === 'inbound' ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {entry.direction === 'inbound' ? '<--' : '-->'}
          </span>
          <span className="text-slate-300">{entry.event}</span>
          {entry.payload && (
            <span className="text-slate-600 truncate ml-1">{entry.payload}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AgentConsole() {
  const { session, lifecyclePhase, connectSession, disconnectSession, manualInterrupt, switchBackend } = useApp();
  const statusCfg = STATUS_CONFIG[session.status];
  const StatusIcon = statusCfg.icon;
  const isActive = session.status === 'active' || session.status === 'interrupted';
  const phaseCfg = PHASE_INDICATOR[lifecyclePhase];
  const PhaseIcon = phaseCfg.icon;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
            {session.status === 'connecting' ? (
              <StatusIcon className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <StatusIcon className="w-3.5 h-3.5" />
            )}
            {statusCfg.label}
          </div>
          {isActive && (
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${phaseCfg.color}`}>
              <PhaseIcon className={`w-3.5 h-3.5 ${lifecyclePhase === 'handshake' || lifecyclePhase === 'model_processing' ? 'animate-pulse' : ''}`} />
              {phaseCfg.label}
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowDownToLine className="w-3 h-3" />
              <span>Streaming @ 24kHz / 16-bit Mono</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 glass-card-sm p-0.5">
            <button
              onClick={() => switchBackend('gemini-3.1-pro-preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                session.backend === 'gemini-3.1-pro-preview'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inner-glow-emerald'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              Gemini 3.1 Pro
            </button>
            <button
              onClick={() => switchBackend('gemini-2.5-flash-fallback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                session.backend === 'gemini-2.5-flash-fallback'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              2.5 Flash Fallback
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas Audio Visualizer */}
        <div className="relative border-b border-white/[0.06] bg-slate-950/50">
          {isActive ? (
            <AudioVisualizer isActive={isActive} phase={lifecyclePhase} />
          ) : (
            <div className="h-40 flex items-center justify-center">
              <button
                onClick={connectSession}
                className="flex items-center gap-3 px-7 py-3.5 rounded-xl glass-card border-emerald-500/25 text-emerald-400 hover:border-emerald-500/40 transition-all duration-300 group inner-glow-emerald"
              >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Click to Connect Mic</span>
              </button>
            </div>
          )}
        </div>

        {/* Control Core */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] bg-slate-900/40">
          {isActive ? (
            <>
              <button
                onClick={manualInterrupt}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-red-600/20 active:scale-95"
              >
                <AlertOctagon className="w-4 h-4" />
                MANUAL INTERRUPT
              </button>
              <button
                onClick={disconnectSession}
                className="flex items-center gap-2 px-4 py-2.5 glass-card-sm hover:bg-slate-800/80 text-slate-300 transition-all text-sm"
              >
                <MicOff className="w-4 h-4" />
                Disconnect
              </button>
            </>
          ) : session.status === 'connecting' ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Establishing connection...
            </div>
          ) : (
            <div className="text-slate-600 text-sm">Connect to start a voice session</div>
          )}
        </div>

        {/* Dual-Panel Caption Streamer */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Transcripts */}
          <div className="flex-1 border-r border-white/[0.06] flex flex-col min-h-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] bg-slate-900/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Live Transcription</span>
            </div>
            <div className="flex-1 min-h-0">
              <TranscriptPanel />
            </div>
          </div>

          {/* Right: Dev Console */}
          <div className="w-[420px] flex flex-col min-h-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] bg-slate-900/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">WebSocket Frames</span>
            </div>
            <div className="flex-1 min-h-0 bg-slate-950/30">
              <DevConsole />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
