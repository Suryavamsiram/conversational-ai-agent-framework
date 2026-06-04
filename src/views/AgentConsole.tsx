import { useApp } from '../state/AppContext';
import type { VoiceSessionStatus } from '../types';
import { Wifi, WifiOff, TriangleAlert as AlertTriangle, Loader as Loader2, Mic, MicOff, OctagonAlert as AlertOctagon, ArrowDownToLine } from 'lucide-react';
import { useEffect, useRef } from 'react';

const STATUS_CONFIG: Record<VoiceSessionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connecting: { label: 'Connecting', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: Loader2 },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', icon: Wifi },
  interrupted: { label: 'Interrupted', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: AlertTriangle },
  disconnected: { label: 'Disconnected', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30', icon: WifiOff },
};

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  const bars = 64;
  return (
    <div className="flex items-center justify-center h-40 gap-[2px] px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const centerDist = Math.abs(i - bars / 2) / (bars / 2);
        const baseHeight = (1 - centerDist * 0.6) * 70;
        const delay = (i * 0.04) % 1.2;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500/40 to-emerald-400 animate-wave-bar origin-bottom"
            style={{
              height: `${baseHeight}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${0.8 + Math.random() * 0.8}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function TranscriptPanel() {
  const { session } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
          className={`animate-fade-in-up rounded-lg p-3 text-sm ${
            entry.role === 'user'
              ? 'bg-slate-800/60 border border-slate-700/40 ml-4'
              : 'bg-indigo-500/8 border border-indigo-500/20 mr-4'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              entry.role === 'user' ? 'text-emerald-400' : 'text-indigo-400'
            }`}>
              {entry.role === 'user' ? 'User Transcript' : 'Agent Response'}
            </span>
            <span className="text-[10px] text-slate-600">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {entry.isStreaming && (
              <span className="text-[10px] text-amber-400 animate-blink">streaming...</span>
            )}
          </div>
          <p className={`leading-relaxed ${
            entry.role === 'user' ? 'text-slate-300' : 'text-indigo-200'
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
  const { session, connectSession, disconnectSession, manualInterrupt, switchBackend } = useApp();
  const statusCfg = STATUS_CONFIG[session.status];
  const StatusIcon = statusCfg.icon;
  const isActive = session.status === 'active';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/40 bg-slate-900/50">
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
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowDownToLine className="w-3 h-3" />
              <span>Streaming @ {24}kHz / 16-bit Mono</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/40">
            <button
              onClick={() => switchBackend('gemini-3.1-pro-preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                session.backend === 'gemini-3.1-pro-preview'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              Gemini 3.1 Pro Preview
            </button>
            <button
              onClick={() => switchBackend('gemini-2.5-flash-fallback')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                session.backend === 'gemini-2.5-flash-fallback'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              Gemini 2.5 Flash Fallback
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Waveform Panel */}
        <div className="relative border-b border-slate-700/40 bg-slate-950/50">
          {isActive ? (
            <WaveformVisualizer isActive />
          ) : (
            <div className="h-40 flex items-center justify-center">
              <button
                onClick={connectSession}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200 group"
              >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Click to Connect Mic</span>
              </button>
            </div>
          )}
          {/* Scan line effect */}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-full h-px bg-emerald-400/10 animate-scan" />
            </div>
          )}
        </div>

        {/* Control Core */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-700/40 bg-slate-900/30">
          {isActive ? (
            <>
              <button
                onClick={manualInterrupt}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all duration-150 shadow-lg shadow-red-600/20 active:scale-95"
              >
                <AlertOctagon className="w-4 h-4" />
                MANUAL INTERRUPT
              </button>
              <button
                onClick={disconnectSession}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg transition-all text-sm"
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
          <div className="flex-1 border-r border-slate-700/40 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-slate-700/30 bg-slate-900/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Transcription</span>
            </div>
            <div className="flex-1 min-h-0">
              <TranscriptPanel />
            </div>
          </div>

          {/* Right: Dev Console */}
          <div className="w-[420px] flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-slate-700/30 bg-slate-900/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">WebSocket Frames</span>
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
