import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AuthState,
  OrgConfig,
  User,
  VoiceSessionState,
  ProcessingBackend,
  TranscriptEntry,
  LogEntry,
  ApiKey,
  TelemetryMetrics,
  AppView,
} from '../types';

const MOCK_ORGS: OrgConfig[] = [
  { id: 'org-ent-001', name: 'Enterprise Voice Agent', tier: 'enterprise', memberCount: 24 },
  { id: 'org-scale-002', name: 'Scale Operations Inc.', tier: 'scale', memberCount: 8 },
  { id: 'org-dev-003', name: 'Dev Sandbox', tier: 'developer', memberCount: 1 },
];

const MOCK_USER: User = {
  id: 'usr-a7f3c9e1',
  email: 'kai.chen@swarmvoice.ai',
  name: 'Kai Chen',
  role: 'Admin',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function generateMockKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'sk_live_';
  for (let i = 0; i < 28; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

const WS_EVENTS = [
  { event: 'AUDIO_FRAME_RECEIVED', bytes: 4096 },
  { event: 'AUDIO_FRAME_SENT', bytes: 2048 },
  { event: 'TRANSCRIPTION_PARTIAL', text: 'processi...' },
  { event: 'INFERENCE_TOKEN_GENERATED', latency_ms: 18 },
  { event: 'AUDIO_FRAME_RECEIVED', bytes: 4096 },
  { event: 'STATE_UPDATE', session: 'streaming' },
  { event: 'AUDIO_FRAME_SENT', bytes: 3072 },
  { event: 'HEARTBEAT_ACK', rtt_ms: 12 },
  { event: 'QUEUE_FLUSHED', reason: 'end_of_turn' },
  { event: 'AUDIO_FRAME_RECEIVED', bytes: 4096 },
  { event: 'TRANSCRIPTION_FINAL', text: 'How can I help?' },
  { event: 'API_429_TRIGGERED_FAILOVER', target: 'gemini-2.5-flash' },
  { event: 'FAILOVER_COMPLETE', duration_ms: 340 },
  { event: 'AUDIO_FRAME_SENT', bytes: 2048 },
  { event: 'METRICS_SNAPSHOT', p50_ms: 1180 },
  { event: 'AUDIO_FRAME_RECEIVED', bytes: 5120 },
  { event: 'INFERENCE_COMPLETE', tokens: 42 },
];

const USER_TRANSCRIPTS = [
  "Hey, I need to check the status of my recent deployment.",
  "Can you pull up the error logs from the last hour?",
  "What's the current latency on the east coast cluster?",
  "Restart the failed worker nodes, please.",
  "Show me the throughput metrics for today.",
];

const AGENT_TRANSCRIPTS = [
  "I can see your deployment from 14:32 UTC. It's currently in a rolling update phase with 3 of 5 pods ready. Would you like me to monitor it?",
  "Pulling error logs now. I found 47 errors in the last hour, primarily 503s from the auth-gateway service. The root cause appears to be a connection pool exhaustion.",
  "East coast cluster latency is averaging 1.2 seconds P50, which is within your SLA target. There was a brief spike to 2.1s at 11:15 UTC but it resolved within 30 seconds.",
  "Initiating graceful restart on 2 failed worker nodes in us-east-1b. Nodes are cordoned and draining. Estimated completion: 45 seconds.",
  "Today's throughput metrics: 2.4M requests processed, 99.97% success rate, average response time 89ms. Peak load was at 09:30 UTC at 38,000 RPS.",
];

export function useAppState() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    currentOrg: null,
    availableOrgs: MOCK_ORGS,
  });

  const [activeView, setActiveView] = useState<AppView>('console');

  const [session, setSession] = useState<VoiceSessionState>({
    status: 'disconnected',
    backend: 'gemini-3.1-pro-preview',
    transcripts: [],
    logs: [],
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 'key-1', name: 'Production API', key: 'sk_live_7a9fb3c2d4e1f0a8b6d5', createdAt: '2026-05-15T10:00:00Z', scope: 'full', status: 'active' },
    { id: 'key-2', name: 'Staging Read-Only', key: 'sk_live_2e8d4a1c7b3f9e0d5a6c', createdAt: '2026-05-20T14:30:00Z', scope: 'read', status: 'active' },
    { id: 'key-3', name: 'CI/CD Pipeline', key: 'sk_live_9c1e5b3a7d2f8a0e4b6c', createdAt: '2026-05-28T09:15:00Z', scope: 'write', status: 'active' },
  ]);

  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    p50LatencyMs: 1180,
    audioThroughputKbps: 384,
    tokenGenSpeedTps: 75,
    failoverProPrimaryPercent: 94,
    failoverFlashPercent: 6,
    latencyHistory: [1320, 1280, 1150, 1190, 1240, 1080, 1180, 1120, 1050, 1180],
    throughputHistory: [372, 380, 384, 376, 388, 384, 392, 384, 380, 384],
    tokenHistory: [68, 72, 75, 78, 71, 75, 80, 75, 73, 75],
  });

  const wsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptIdxRef = useRef(0);

  const signIn = useCallback((email: string, _password: string) => {
    const user: User = { ...MOCK_USER, email };
    setAuth({
      isAuthenticated: true,
      user,
      currentOrg: MOCK_ORGS[0],
      availableOrgs: MOCK_ORGS,
    });
  }, []);

  const signUp = useCallback((name: string, email: string, _password: string) => {
    const user: User = { ...MOCK_USER, name, email };
    setAuth({
      isAuthenticated: true,
      user,
      currentOrg: MOCK_ORGS[0],
      availableOrgs: MOCK_ORGS,
    });
  }, []);

  const signOut = useCallback(() => {
    if (wsIntervalRef.current) clearInterval(wsIntervalRef.current);
    wsIntervalRef.current = null;
    setAuth({
      isAuthenticated: false,
      user: null,
      currentOrg: null,
      availableOrgs: MOCK_ORGS,
    });
    setSession(prev => ({ ...prev, status: 'disconnected', transcripts: [], logs: [] }));
    setActiveView('console');
  }, []);

  const switchOrg = useCallback((orgId: string) => {
    const org = auth.availableOrgs.find(o => o.id === orgId);
    if (org) setAuth(prev => ({ ...prev, currentOrg: org }));
  }, [auth.availableOrgs]);

  const connectSession = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'connecting' }));
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'active' }));
    }, 1200);
  }, []);

  const disconnectSession = useCallback(() => {
    if (wsIntervalRef.current) clearInterval(wsIntervalRef.current);
    wsIntervalRef.current = null;
    setSession(prev => ({ ...prev, status: 'disconnected' }));
  }, []);

  const manualInterrupt = useCallback(() => {
    setSession(prev => ({
      ...prev,
      status: 'interrupted',
      logs: [
        ...prev.logs,
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          direction: 'outbound',
          event: 'MANUAL_INTERRUPT',
          payload: '{"action":"QUEUE_FLUSH","source":"user_button"}',
        },
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          direction: 'inbound',
          event: 'QUEUE_FLUSHED',
          payload: '{"reason":"user_interrupt","bufferCleared":true}',
        },
      ],
    }));
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        status: 'active',
        transcripts: [
          ...prev.transcripts,
          {
            id: generateId(),
            timestamp: new Date().toISOString(),
            role: 'agent',
            text: '[SYSTEM]: Queue Flushed via User Interruption',
          },
        ],
      }));
    }, 400);
  }, []);

  const switchBackend = useCallback((backend: ProcessingBackend) => {
    setSession(prev => ({ ...prev, backend }));
  }, []);

  const generateApiKey = useCallback((name: string, scope: 'full' | 'read' | 'write') => {
    const newKey: ApiKey = {
      id: `key-${generateId()}`,
      name,
      key: generateMockKey(),
      createdAt: new Date().toISOString(),
      scope,
      status: 'active',
    };
    setApiKeys(prev => [...prev, newKey]);
    return newKey;
  }, []);

  const revokeApiKey = useCallback((keyId: string) => {
    setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k));
  }, []);

  // Simulated WebSocket event stream
  useEffect(() => {
    if (session.status !== 'active') {
      if (wsIntervalRef.current) clearInterval(wsIntervalRef.current);
      wsIntervalRef.current = null;
      return;
    }
    if (wsIntervalRef.current) return;

    let eventCounter = 0;
    wsIntervalRef.current = setInterval(() => {
      eventCounter++;
      const wsEvent = WS_EVENTS[Math.floor(Math.random() * WS_EVENTS.length)];
      const logEntry: LogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
        event: wsEvent.event,
        payload: JSON.stringify(wsEvent),
      };
      setSession(prev => ({
        ...prev,
        logs: [...prev.logs.slice(-200), logEntry],
      }));

      // Occasionally add transcript entries
      if (eventCounter % 8 === 0) {
        const idx = transcriptIdxRef.current % Math.min(USER_TRANSCRIPTS.length, AGENT_TRANSCRIPTS.length);
        const userEntry: TranscriptEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          role: 'user',
          text: USER_TRANSCRIPTS[idx],
        };
        setSession(prev => ({
          ...prev,
          transcripts: [...prev.transcripts.slice(-100), userEntry],
        }));
        setTimeout(() => {
          const agentEntry: TranscriptEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            role: 'agent',
            text: AGENT_TRANSCRIPTS[idx],
            isStreaming: true,
          };
          setSession(prev => ({
            ...prev,
            transcripts: [...prev.transcripts.slice(-100), agentEntry],
          }));
          setTimeout(() => {
            setSession(prev => ({
              ...prev,
              transcripts: prev.transcripts.map(t =>
                t.id === agentEntry.id ? { ...t, isStreaming: false } : t
              ),
            }));
          }, 1500);
          transcriptIdxRef.current++;
        }, 800);
      }

      // Update telemetry periodically
      if (eventCounter % 5 === 0) {
        setTelemetry(prev => {
          const newLatency = prev.p50LatencyMs + (Math.random() - 0.5) * 200;
          const newThroughput = prev.audioThroughputKbps + (Math.random() - 0.5) * 20;
          const newTokenSpeed = prev.tokenGenSpeedTps + (Math.random() - 0.5) * 10;
          const flashInc = Math.random() > 0.92;
          const newFlash = flashInc
            ? Math.min(prev.failoverFlashPercent + 2, 20)
            : Math.max(prev.failoverFlashPercent - 0.5, 3);
          return {
            p50LatencyMs: Math.max(800, Math.min(1500, newLatency)),
            audioThroughputKbps: Math.max(340, Math.min(420, newThroughput)),
            tokenGenSpeedTps: Math.max(55, Math.min(95, newTokenSpeed)),
            failoverProPrimaryPercent: 100 - newFlash,
            failoverFlashPercent: newFlash,
            latencyHistory: [...prev.latencyHistory.slice(-9), Math.max(800, Math.min(1500, newLatency))],
            throughputHistory: [...prev.throughputHistory.slice(-9), Math.max(340, Math.min(420, newThroughput))],
            tokenHistory: [...prev.tokenHistory.slice(-9), Math.max(55, Math.min(95, newTokenSpeed))],
          };
        });
      }
    }, 1500);

    return () => {
      if (wsIntervalRef.current) clearInterval(wsIntervalRef.current);
      wsIntervalRef.current = null;
    };
  }, [session.status]);

  return {
    auth,
    activeView,
    session,
    apiKeys,
    telemetry,
    signIn,
    signUp,
    signOut,
    switchOrg,
    setActiveView,
    connectSession,
    disconnectSession,
    manualInterrupt,
    switchBackend,
    generateApiKey,
    revokeApiKey,
  };
}
