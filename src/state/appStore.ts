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

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>(DEFAULT_TELEMETRY);
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

  // Load user data from Supabase after auth
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        console.error('Failed to load user profile:', profileErr.message);
        return;
      }
      if (!profile) return;

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      };

      // Fetch all orgs this user can see (peers in their org)
      const { data: orgRows, error: orgsErr } = await supabase
        .from('users')
        .select('org_id, organizations!users_org_id_fkey(id, name, tier, member_count)')
        .eq('id', userId);

      if (orgsErr) {
        console.error('Failed to load organizations:', orgsErr.message);
      }

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

      setAuth({
        isAuthenticated: true,
        user,
        currentOrg,
        availableOrgs,
      });

      // Load API keys for current org
      if (currentOrg) {
        const { data: keys, error: keysErr } = await supabase
          .from('api_keys')
          .select('*')
          .eq('org_id', currentOrg.id)
          .eq('status', 'active');

        if (keysErr) {
          console.error('Failed to load API keys:', keysErr.message);
        } else if (keys) {
          setApiKeys(keys.map((k: Record<string, unknown>) => ({
            id: k.id as string,
            name: k.name as string,
            key: k.key_hash as string,
            createdAt: k.created_at as string,
            scope: k.scope as 'full' | 'read' | 'write',
            status: k.status as 'active' | 'revoked',
          })));
        }

        // Load recent telemetry
        const { data: telRows, error: telErr } = await supabase
          .from('telemetry_snapshots')
          .select('*')
          .eq('org_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (telErr) {
          console.error('Failed to load telemetry:', telErr.message);
        } else if (telRows && telRows.length > 0) {
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

  // Auth state listener
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
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Auth actions
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    // The database trigger (handle_new_user) auto-creates profile + org
    // If the trigger didn't fire (edge case), create manually as fallback
    if (data.user && !data.session) {
      addToast('Check your email to confirm your account, then sign in.', 'info');
    } else if (data.user && data.session) {
      // Wait for the trigger to create the profile before loading
      await new Promise(r => setTimeout(r, 1000));
      await loadUserData(data.user.id);
    }
  }, [addToast, loadUserData]);

  const signOut = useCallback(async () => {
    // Clean up intervals
    if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
    if (telemetryTimerRef.current) { clearInterval(telemetryTimerRef.current); telemetryTimerRef.current = null; }
    wsLockRef.current = false;
    setSession(prev => ({ ...prev, status: 'disconnected', transcripts: [], logs: [] }));
    setActiveView('console');
    const { error } = await supabase.auth.signOut();
    if (error) addToast('Failed to sign out: ' + error.message, 'error');
  }, [addToast]);

  const switchOrg = useCallback(async (orgId: string) => {
    const org = auth.availableOrgs.find(o => o.id === orgId);
    if (!org) return;

    if (auth.user) {
      const { error } = await supabase.from('users').update({ org_id: orgId }).eq('id', auth.user.id);
      if (error) {
        addToast('Failed to switch organization: ' + error.message, 'error');
        return;
      }
    }

    setAuth(prev => ({ ...prev, currentOrg: org }));

    const { data: keys, error: keysErr } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (keysErr) {
      addToast('Failed to load API keys for organization', 'error');
    } else {
      setApiKeys(keys?.map((k: Record<string, unknown>) => ({
        id: k.id as string,
        name: k.name as string,
        key: k.key_hash as string,
        createdAt: k.created_at as string,
        scope: k.scope as 'full' | 'read' | 'write',
        status: k.status as 'active' | 'revoked',
      })) || []);
    }

    addToast(`Switched to ${org.name}`, 'success');
  }, [auth.availableOrgs, auth.user, addToast]);

  // Voice session actions
  const connectSession = useCallback(() => {
    setSession(prev => ({ ...prev, status: 'connecting' }));
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'active' }));
    }, 1200);
  }, []);

  const disconnectSession = useCallback(() => {
    if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
    wsLockRef.current = false;
    setSession(prev => ({ ...prev, status: 'disconnected' }));
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
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        status: 'active',
        transcripts: [...prev.transcripts, { id: generateId(), timestamp: new Date().toISOString(), role: 'agent', text: '[SYSTEM]: Queue Flushed via User Interruption' }],
      }));
    }, 400);
  }, []);

  const switchBackend = useCallback((backend: ProcessingBackend) => {
    setSession(prev => ({ ...prev, backend }));
    addToast(`Switched to ${backend === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro Preview' : 'Gemini 2.5 Flash Fallback'}`, 'info');
  }, [addToast]);

  // API key actions with proper rollback on failure
  const generateApiKey = useCallback(async (name: string, scope: 'full' | 'read' | 'write') => {
    const fullKey = generateMockKey();
    const newKey: ApiKey = {
      id: generateId(),
      name,
      key: fullKey,
      createdAt: new Date().toISOString(),
      scope,
      status: 'active',
    };

    if (auth.currentOrg) {
      const { error } = await supabase.from('api_keys').insert({
        org_id: auth.currentOrg.id,
        name,
        key_hash: fullKey,
        scope,
        status: 'active',
      });
      if (error) {
        addToast('Failed to create API key: ' + error.message, 'error');
        // Don't add to local state if DB insert failed
        return newKey;
      }
    }

    setApiKeys(prev => [...prev, newKey]);
    addToast(`API key "${name}" created`, 'success');
    return newKey;
  }, [auth.currentOrg, addToast]);

  const revokeApiKey = useCallback(async (keyId: string, keyName: string) => {
    // Optimistic update: remove from UI immediately
    setApiKeys(prev => prev.filter(k => k.id !== keyId));

    const { error } = await supabase.from('api_keys').update({ status: 'revoked' }).eq('id', keyId);
    if (error) {
      // Rollback: re-add the key to UI
      addToast('Failed to revoke key: ' + error.message, 'error');
      // Reload keys from DB to restore state
      if (auth.currentOrg) {
        const { data: keys } = await supabase.from('api_keys').select('*').eq('org_id', auth.currentOrg.id).eq('status', 'active');
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
      }
    } else {
      addToast(`Key "${keyName}" revoked`, 'success');
    }
  }, [auth.currentOrg, addToast]);

  // Telemetry persistence with debounce
  const lastTelemetrySaveRef = useRef<number>(0);
  useEffect(() => {
    if (!auth.currentOrg || !auth.isAuthenticated) return;

    if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current);
    telemetryTimerRef.current = setInterval(async () => {
      const now = Date.now();
      if (now - lastTelemetrySaveRef.current < 25000) return; // debounce
      lastTelemetrySaveRef.current = now;

      const { error } = await supabase.from('telemetry_snapshots').insert({
        org_id: auth.currentOrg!.id,
        p50_latency_ms: telemetry.p50LatencyMs,
        audio_throughput_kbps: telemetry.audioThroughputKbps,
        token_gen_speed_tps: telemetry.tokenGenSpeedTps,
        failover_pro_pct: telemetry.failoverProPrimaryPercent,
        failover_flash_pct: telemetry.failoverFlashPercent,
      });
      if (error) {
        // Silent failure for telemetry - non-critical data
        console.warn('Telemetry snapshot failed:', error.message);
      }
    }, 30000);

    return () => {
      if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current);
    };
  }, [auth.currentOrg, auth.isAuthenticated, telemetry.p50LatencyMs, telemetry.audioThroughputKbps, telemetry.tokenGenSpeedTps, telemetry.failoverProPrimaryPercent, telemetry.failoverFlashPercent]);

  // WebSocket simulation with race condition protection
  useEffect(() => {
    if (session.status !== 'active') {
      if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
      wsLockRef.current = false;
      return;
    }

    // Use a lock to prevent duplicate intervals
    if (wsLockRef.current) return;
    wsLockRef.current = true;

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
      if (wsIntervalRef.current) { clearInterval(wsIntervalRef.current); wsIntervalRef.current = null; }
      wsLockRef.current = false;
    };
  }, [session.status]);

  return {
    auth,
    authLoading,
    activeView,
    session,
    apiKeys,
    telemetry,
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
    addToast,
  };
}
