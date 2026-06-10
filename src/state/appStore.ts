import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  AgentConfig,
  PhoneRoutingEntry,
  InvoiceLineItem,
  CallLifecyclePhase,
} from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function generateMockKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'sk_live_';
  for (let i = 0; i < 28; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

// --- Mock Data ---

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

const MOCK_AGENTS: AgentConfig[] = [
  { id: 'agent-1', name: 'Customer Support Agent', description: 'Handles inbound customer inquiries and escalations', systemPrompt: 'You are a helpful customer support agent for SwarmVoice AI. Be concise and professional.', modelTemperature: 0.3, modelTopP: 0.9, maxTokenCap: 4096, voicePitch: 1.0, voiceSpeed: 1.0, voiceGender: 'female', isActive: true, createdAt: '2026-05-01T10:00:00Z' },
  { id: 'agent-2', name: 'Sales Qualifier', description: 'Pre-qualifies leads and schedules demos', systemPrompt: 'You are a sales qualification agent. Identify prospect needs and match them to our platform tiers.', modelTemperature: 0.5, modelTopP: 0.85, maxTokenCap: 2048, voicePitch: 0.9, voiceSpeed: 1.1, voiceGender: 'male', isActive: true, createdAt: '2026-05-15T14:00:00Z' },
  { id: 'agent-3', name: 'DevOps Monitor', description: 'Monitors infrastructure alerts and responds to incidents', systemPrompt: 'You are a DevOps monitoring agent. Analyze alerts, correlate incidents, and suggest remediation steps.', modelTemperature: 0.2, modelTopP: 0.95, maxTokenCap: 8192, voicePitch: 1.0, voiceSpeed: 0.95, voiceGender: 'neutral', isActive: false, createdAt: '2026-06-01T09:00:00Z' },
];

const MOCK_PHONE_ROUTING: PhoneRoutingEntry[] = [
  { id: 'ph-1', phoneNumber: '+1 (415) 555-0192', country: 'US', assignedAgentId: 'agent-1', assignedAgentName: 'Customer Support Agent', status: 'active', monthlyCost: 4.99, minutesUsed: 847 },
  { id: 'ph-2', phoneNumber: '+44 20 7946 0958', country: 'GB', assignedAgentId: 'agent-2', assignedAgentName: 'Sales Qualifier', status: 'active', monthlyCost: 6.99, minutesUsed: 312 },
  { id: 'ph-3', phoneNumber: '+1 (646) 555-0234', country: 'US', assignedAgentId: null, assignedAgentName: null, status: 'pending', monthlyCost: 4.99, minutesUsed: 0 },
  { id: 'ph-4', phoneNumber: '+61 2 5555 0176', country: 'AU', assignedAgentId: 'agent-1', assignedAgentName: 'Customer Support Agent', status: 'inactive', monthlyCost: 5.99, minutesUsed: 156 },
];

const MOCK_INVOICES: InvoiceLineItem[] = [
  { id: 'inv-1', date: '2026-05-01', description: 'Scale Business Plan - Monthly', quantity: 1, unitPrice: 149.00, total: 149.00, status: 'paid' },
  { id: 'inv-2', date: '2026-05-01', description: 'Voice Minutes Overage (312 min)', quantity: 312, unitPrice: 0.08, total: 24.96, status: 'paid' },
  { id: 'inv-3', date: '2026-05-01', description: 'US Virtual Number +1 (415) 555-0192', quantity: 1, unitPrice: 4.99, total: 4.99, status: 'paid' },
  { id: 'inv-4', date: '2026-05-01', description: 'GB Virtual Number +44 20 7946 0958', quantity: 1, unitPrice: 6.99, total: 6.99, status: 'paid' },
  { id: 'inv-5', date: '2026-06-01', description: 'Scale Business Plan - Monthly', quantity: 1, unitPrice: 149.00, total: 149.00, status: 'paid' },
  { id: 'inv-6', date: '2026-06-01', description: 'Voice Minutes Overage (89 min)', quantity: 89, unitPrice: 0.08, total: 7.12, status: 'pending' },
  { id: 'inv-7', date: '2026-06-01', description: 'US Virtual Number +1 (415) 555-0192', quantity: 1, unitPrice: 4.99, total: 4.99, status: 'pending' },
  { id: 'inv-8', date: '2026-06-01', description: 'GB Virtual Number +44 20 7946 0958', quantity: 1, unitPrice: 6.99, total: 6.99, status: 'pending' },
  { id: 'inv-9', date: '2026-06-01', description: 'Token Usage Overage (142K tokens)', quantity: 142000, unitPrice: 0.00003, total: 4.26, status: 'pending' },
];

const DEFAULT_TELEMETRY: TelemetryMetrics = {
  p50LatencyMs: 1180,
  audioThroughputKbps: 384,
  tokenGenSpeedTps: 75,
  failoverProPrimaryPercent: 94,
  failoverFlashPercent: 6,
  latencyHistory: [1320, 1280, 1150, 1190, 1240, 1080, 1180, 1120, 1050, 1180],
  throughputHistory: [372, 380, 384, 376, 388, 384, 392, 384, 380, 384],
  tokenHistory: [68, 72, 75, 78, 71, 75, 80, 75, 73, 75],
};

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useAppState() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    currentOrg: null,
    availableOrgs: [],
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [activeView, setActiveView] = useState<AppView>('console');

  const [session, setSession] = useState<VoiceSessionState>({
    status: 'disconnected',
    backend: 'gemini-3.1-pro-preview',
    transcripts: [],
    logs: [],
  });

  // Lifecycle phase for simulation
  const [lifecyclePhase, setLifecyclePhase] = useState<CallLifecyclePhase>('idle');

  // Extended telemetry
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>(DEFAULT_TELEMETRY);
  const [jitterMs, setJitterMs] = useState(12);
  const [packetLossPercent, setPacketLossPercent] = useState(0.2);
  const [activeConcurrentPipelines, setActiveConcurrentPipelines] = useState(3);
  const [tokenUsageTotal, setTokenUsageTotal] = useState(1247893);
  const [estimatedCostUsd, setEstimatedCostUsd] = useState(37.42);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>(MOCK_AGENTS);
  const [phoneRoutes, setPhoneRoutes] = useState<PhoneRoutingEntry[]>(MOCK_PHONE_ROUTING);
  const [invoices] = useState<InvoiceLineItem[]>(MOCK_INVOICES);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const wsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const telemetryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptIdxRef = useRef(0);
  const wsLockRef = useRef(false);

  // Toast helpers
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // --- Supabase Auth & Data Loading ---

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr || !profile) return;

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      };

      const { data: orgRows } = await supabase
        .from('users')
        .select('org_id, organizations!users_org_id_fkey(id, name, tier, member_count)')
        .eq('id', userId);

      const availableOrgs: OrgConfig[] = (orgRows || []).map((row: Record<string, unknown>) => {
        const org = row.organizations as Record<string, unknown>;
        return {
          id: org.id as string,
          name: org.name as string,
          tier: org.tier as 'developer' | 'scale' | 'enterprise',
          memberCount: org.member_count as number,
        };
      });

      const currentOrg = availableOrgs.find(o => o.id === profile.org_id) || availableOrgs[0] || null;

      setAuth({ isAuthenticated: true, user, currentOrg, availableOrgs });

      if (currentOrg) {
        const { data: keys } = await supabase.from('api_keys').select('*').eq('org_id', currentOrg.id).eq('status', 'active');
        if (keys) {
          setApiKeys(keys.map((k: Record<string, unknown>) => ({
            id: k.id as string,
            name: k.name as string,
            key: k.key_hash as string,
            createdAt: k.created_at as string,
            scope: k.scope as 'full' | 'read' | 'write',
            status: k.status as 'active' | 'revoked',
          })));
        }

        const { data: telRows } = await supabase
          .from('telemetry_snapshots')
          .select('*')
          .eq('org_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (telRows && telRows.length > 0) {
          const latest = telRows[0];
          const reversed = [...telRows].reverse();
          setTelemetry({
            p50LatencyMs: latest.p50_latency_ms,
            audioThroughputKbps: latest.audio_throughput_kbps,
            tokenGenSpeedTps: latest.token_gen_speed_tps,
            failoverProPrimaryPercent: latest.failover_pro_pct,
            failoverFlashPercent: latest.failover_flash_pct,
            latencyHistory: reversed.map((t: Record<string, number>) => t.p50_latency_ms),
            throughputHistory: reversed.map((t: Record<string, number>) => t.audio_throughput_kbps),
            tokenHistory: reversed.map((t: Record<string, number>) => t.token_gen_speed_tps),
          });
        }
      }
    } catch (err) {
      console.error('loadUserData failed:', err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sbSession) => {
      (async () => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && sbSession?.user) {
          await loadUserData(sbSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setAuth({ isAuthenticated: false, user: null, currentOrg: null, availableOrgs: [] });
          setApiKeys([]);
          setTelemetry(DEFAULT_TELEMETRY);
        }
      })();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user.id);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // --- Auth Actions ---

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    if (data.user && !data.session) {
      addToast('Check your email to confirm your account, then sign in.', 'info');
    } else if (data.user && data.session) {
      await new Promise(r => setTimeout(r, 1000));
      await loadUserData(data.user.id);
    }
  }, [addToast, loadUserData]);

  const signOut = useCallback(async () => {
    if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
    if (telemetryTimerRef.current) { clearInterval(telemetryTimerRef.current); telemetryTimerRef.current = null; }
    wsLockRef.current = false;
    setSession(prev => ({ ...prev, status: 'disconnected', transcripts: [], logs: [] }));
    setLifecyclePhase('idle');
    setActiveView('console');
    const { error } = await supabase.auth.signOut();
    if (error) addToast('Failed to sign out: ' + error.message, 'error');
  }, [addToast]);

  const switchOrg = useCallback(async (orgId: string) => {
    const org = auth.availableOrgs.find(o => o.id === orgId);
    if (!org) return;

    if (auth.user) {
      const { error } = await supabase.from('users').update({ org_id: orgId }).eq('id', auth.user.id);
      if (error) { addToast('Failed to switch organization: ' + error.message, 'error'); return; }
    }

    setAuth(prev => ({ ...prev, currentOrg: org }));

    const { data: keys, error: keysErr } = await supabase.from('api_keys').select('*').eq('org_id', orgId).eq('status', 'active');
    if (keysErr) { addToast('Failed to load API keys', 'error'); }
    else {
      setApiKeys(keys?.map((k: Record<string, unknown>) => ({
        id: k.id as string, name: k.name as string, key: k.key_hash as string,
        createdAt: k.created_at as string, scope: k.scope as 'full' | 'read' | 'write',
        status: k.status as 'active' | 'revoked',
      })) || []);
    }

    addToast(`Switched to ${org.name}`, 'success');
  }, [auth.availableOrgs, auth.user, addToast]);

  // --- Voice Session Lifecycle Simulation ---

  const connectSession = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'connecting' }));
    setLifecyclePhase('handshake');

    // Simulate handshake phase
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'active' }));
      setLifecyclePhase('user_speaking');
    }, 1200);
  }, []);

  const disconnectSession = useCallback(() => {
    setLifecyclePhase('disconnecting');
    if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
    wsLockRef.current = false;
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'disconnected' }));
      setLifecyclePhase('disconnected');
      setTimeout(() => setLifecyclePhase('idle'), 2000);
    }, 600);
  }, []);

  const manualInterrupt = useCallback(() => {
    setSession(prev => ({
      ...prev,
      status: 'interrupted',
      logs: [
        ...prev.logs,
        { id: generateId(), timestamp: new Date().toISOString(), direction: 'outbound', event: 'MANUAL_INTERRUPT', payload: '{"action":"QUEUE_FLUSH","source":"user_button"}' },
        { id: generateId(), timestamp: new Date().toISOString(), direction: 'inbound', event: 'QUEUE_FLUSHED', payload: '{"reason":"user_interrupt","bufferCleared":true}' },
      ],
    }));
    setLifecyclePhase('agent_speaking');
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'active' }));
      setLifecyclePhase('user_speaking');
    }, 400);
  }, []);

  const switchBackend = useCallback((backend: ProcessingBackend) => {
    setSession(prev => ({ ...prev, backend }));
    addToast(`Switched to ${backend === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro Preview' : 'Gemini 2.5 Flash Fallback'}`, 'info');
  }, [addToast]);

  // --- API Key Actions ---

  const generateApiKey = useCallback(async (name: string, scope: 'full' | 'read' | 'write') => {
    const fullKey = generateMockKey();
    const newKey: ApiKey = { id: generateId(), name, key: fullKey, createdAt: new Date().toISOString(), scope, status: 'active' };

    if (auth.currentOrg) {
      const { error } = await supabase.from('api_keys').insert({ org_id: auth.currentOrg.id, name, key_hash: fullKey, scope, status: 'active' });
      if (error) { addToast('Failed to create API key: ' + error.message, 'error'); return newKey; }
    }

    setApiKeys(prev => [...prev, newKey]);
    addToast(`API key "${name}" created`, 'success');
    return newKey;
  }, [auth.currentOrg, addToast]);

  const revokeApiKey = useCallback(async (keyId: string, keyName: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== keyId));
    const { error } = await supabase.from('api_keys').update({ status: 'revoked' }).eq('id', keyId);
    if (error) {
      addToast('Failed to revoke key: ' + error.message, 'error');
      if (auth.currentOrg) {
        const { data: keys } = await supabase.from('api_keys').select('*').eq('org_id', auth.currentOrg.id).eq('status', 'active');
        if (keys) setApiKeys(keys.map((k: Record<string, unknown>) => ({
          id: k.id as string, name: k.name as string, key: k.key_hash as string,
          createdAt: k.created_at as string, scope: k.scope as 'full' | 'read' | 'write',
          status: k.status as 'active' | 'revoked',
        })));
      }
    } else {
      addToast(`Key "${keyName}" revoked`, 'success');
    }
  }, [auth.currentOrg, addToast]);

  // --- Agent Config Actions ---

  const saveAgent = useCallback((agent: AgentConfig) => {
    setAgents(prev => {
      const idx = prev.findIndex(a => a.id === agent.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = agent; return next; }
      return [...prev, agent];
    });
    addToast(`Agent "${agent.name}" saved`, 'success');
  }, [addToast]);

  const toggleAgentActive = useCallback((agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isActive: !a.isActive } : a));
    const agent = agents.find(a => a.id === agentId);
    addToast(`Agent "${agent?.name}" ${agent?.isActive ? 'deactivated' : 'activated'}`, 'success');
  }, [agents, addToast]);

  // --- Phone Routing Actions ---

  const assignAgentToPhone = useCallback((phoneId: string, agentId: string | null, agentName: string | null) => {
    setPhoneRoutes(prev => prev.map(p => p.id === phoneId ? { ...p, assignedAgentId: agentId, assignedAgentName: agentName, status: agentId ? 'active' as const : 'inactive' as const } : p));
    addToast('Phone routing updated', 'success');
  }, [addToast]);

  // --- Telemetry Persistence ---

  const lastTelemetrySaveRef = useRef<number>(0);
  useEffect(() => {
    if (!auth.currentOrg || !auth.isAuthenticated) return;

    if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current);
    telemetryTimerRef.current = setInterval(async () => {
      const now = Date.now();
      if (now - lastTelemetrySaveRef.current < 25000) return;
      lastTelemetrySaveRef.current = now;

      const { error } = await supabase.from('telemetry_snapshots').insert({
        org_id: auth.currentOrg!.id,
        p50_latency_ms: telemetry.p50LatencyMs,
        audio_throughput_kbps: telemetry.audioThroughputKbps,
        token_gen_speed_tps: telemetry.tokenGenSpeedTps,
        failover_pro_pct: telemetry.failoverProPrimaryPercent,
        failover_flash_pct: telemetry.failoverFlashPercent,
      });
      if (error) console.warn('Telemetry snapshot failed:', error.message);
    }, 30000);

    return () => { if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current); };
  }, [auth.currentOrg, auth.isAuthenticated, telemetry.p50LatencyMs, telemetry.audioThroughputKbps, telemetry.tokenGenSpeedTps, telemetry.failoverProPrimaryPercent, telemetry.failoverFlashPercent]);

  // --- WebSocket Simulation with Full Lifecycle ---

  useEffect(() => {
    if (session.status !== 'active') {
      if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
      wsLockRef.current = false;
      return;
    }

    if (wsLockRef.current) return;
    wsLockRef.current = true;

    let eventCounter = 0;
    let phaseTimer: ReturnType<typeof setTimeout> | null = null;

    const cycleLifecycle = () => {
      // Cycle: user_speaking -> model_processing -> agent_speaking -> user_speaking
      setLifecyclePhase(current => {
        if (current === 'user_speaking') {
          phaseTimer = setTimeout(() => setLifecyclePhase('model_processing'), 3000);
          return current;
        }
        if (current === 'model_processing') {
          phaseTimer = setTimeout(() => setLifecyclePhase('agent_speaking'), 1500);
          return current;
        }
        if (current === 'agent_speaking') {
          phaseTimer = setTimeout(() => setLifecyclePhase('user_speaking'), 4000);
          return current;
        }
        return current;
      });
    };

    // Start lifecycle cycling
    phaseTimer = setTimeout(() => setLifecyclePhase('model_processing'), 3000);

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
      setSession(prev => ({ ...prev, logs: [...prev.logs.slice(-200), logEntry] }));

      // Transcript injection based on lifecycle
      if (eventCounter % 8 === 0) {
        const idx = transcriptIdxRef.current % Math.min(USER_TRANSCRIPTS.length, AGENT_TRANSCRIPTS.length);

        const userEntry: TranscriptEntry = {
          id: generateId(), timestamp: new Date().toISOString(), role: 'user', text: USER_TRANSCRIPTS[idx],
        };
        setSession(prev => ({ ...prev, transcripts: [...prev.transcripts.slice(-100), userEntry] }));

        // Model processing phase
        setLifecyclePhase('model_processing');

        setTimeout(() => {
          setLifecyclePhase('agent_speaking');
          const agentEntry: TranscriptEntry = {
            id: generateId(), timestamp: new Date().toISOString(), role: 'agent', text: AGENT_TRANSCRIPTS[idx], isStreaming: true,
          };
          setSession(prev => ({ ...prev, transcripts: [...prev.transcripts.slice(-100), agentEntry] }));
          setTimeout(() => {
            setSession(prev => ({
              ...prev,
              transcripts: prev.transcripts.map(t => t.id === agentEntry.id ? { ...t, isStreaming: false } : t),
            }));
            setLifecyclePhase('user_speaking');
          }, 1500);
          transcriptIdxRef.current++;
        }, 800);

        cycleLifecycle();
      }

      // Extended telemetry updates
      if (eventCounter % 5 === 0) {
        setTelemetry(prev => {
          const newLatency = prev.p50LatencyMs + (Math.random() - 0.5) * 200;
          const newThroughput = prev.audioThroughputKbps + (Math.random() - 0.5) * 20;
          const newTokenSpeed = prev.tokenGenSpeedTps + (Math.random() - 0.5) * 10;
          const flashInc = Math.random() > 0.92;
          const newFlash = flashInc ? Math.min(prev.failoverFlashPercent + 2, 20) : Math.max(prev.failoverFlashPercent - 0.5, 3);
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

        // Update extended metrics
        setJitterMs(Math.max(2, Math.min(45, 12 + (Math.random() - 0.5) * 15)));
        setPacketLossPercent(Math.max(0, Math.min(2.5, 0.2 + (Math.random() - 0.5) * 0.4)));
        setActiveConcurrentPipelines(Math.max(1, Math.min(8, 3 + Math.floor((Math.random() - 0.5) * 4))));
        setTokenUsageTotal(prev => prev + Math.floor(Math.random() * 350 + 50));
        setEstimatedCostUsd(prev => +(prev + Math.random() * 0.012).toFixed(2));
      }
    }, 1500);

    return () => {
      if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
      if (phaseTimer) clearTimeout(phaseTimer);
      wsLockRef.current = false;
    };
  }, [session.status]);

  return {
    auth,
    authLoading,
    activeView,
    session,
    lifecyclePhase,
    telemetry,
    jitterMs,
    packetLossPercent,
    activeConcurrentPipelines,
    tokenUsageTotal,
    estimatedCostUsd,
    apiKeys,
    agents,
    phoneRoutes,
    invoices,
    toasts,
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
    saveAgent,
    toggleAgentActive,
    assignAgentToPhone,
    addToast,
  };
}
