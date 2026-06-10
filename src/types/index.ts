export type VoiceSessionStatus = 'connecting' | 'active' | 'interrupted' | 'disconnected';

export type UserRole = 'Admin' | 'Member';

export type SubscriptionTier = 'developer' | 'scale' | 'enterprise';

export type ProcessingBackend = 'gemini-3.1-pro-preview' | 'gemini-2.5-flash-fallback';

export interface OrgConfig {
  id: string;
  name: string;
  tier: SubscriptionTier;
  memberCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  currentOrg: OrgConfig | null;
  availableOrgs: OrgConfig[];
}

export interface TelemetryMetrics {
  p50LatencyMs: number;
  audioThroughputKbps: number;
  tokenGenSpeedTps: number;
  failoverProPrimaryPercent: number;
  failoverFlashPercent: number;
  latencyHistory: number[];
  throughputHistory: number[];
  tokenHistory: number[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  event: string;
  payload?: string;
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  role: 'user' | 'agent';
  text: string;
  isStreaming?: boolean;
}

export interface VoiceSessionState {
  status: VoiceSessionStatus;
  backend: ProcessingBackend;
  transcripts: TranscriptEntry[];
  logs: LogEntry[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  scope: 'full' | 'read' | 'write';
  status: 'active' | 'revoked';
}

export interface BillingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  voiceMinutes: number;
  overageRate: number;
  features: string[];
  constraints?: string[];
  ctaLabel: string;
  highlighted: boolean;
}

// Extended types for new views

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelTemperature: number;
  modelTopP: number;
  maxTokenCap: number;
  voicePitch: number;
  voiceSpeed: number;
  voiceGender: 'male' | 'female' | 'neutral';
  isActive: boolean;
  createdAt: string;
}

export interface WebhookCallback {
  id: string;
  label: string;
  url: string;
  event: 'on_transcription' | 'on_response' | 'on_error' | 'on_disconnect';
  isActive: boolean;
}

export interface PhoneRoutingEntry {
  id: string;
  phoneNumber: string;
  country: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  status: 'active' | 'inactive' | 'pending';
  monthlyCost: number;
  minutesUsed: number;
}

export interface InvoiceLineItem {
  id: string;
  date: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
}

export type CallLifecyclePhase =
  | 'idle'
  | 'handshake'
  | 'user_speaking'
  | 'model_processing'
  | 'agent_speaking'
  | 'disconnecting'
  | 'disconnected';

export type AppView = 'console' | 'developer' | 'analytics' | 'agents' | 'routing' | 'billing';
