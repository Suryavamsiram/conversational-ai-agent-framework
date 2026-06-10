/**
 * SwarmVoice AI - Strongly Typed Swarm Interfaces
 *
 * Domain-specific types for the voice agent orchestration layer.
 */

/** A single chunk of streaming transcription output */
export interface TranscriptChunk {
  id: string;
  sessionId: string;
  role: 'user' | 'agent';
  text: string;
  isStreaming: boolean;
  timestamp: string;
  confidence: number;
  language: string;
}

/** Behavioral configuration for a voice agent profile */
export interface AgentConfiguration {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelTemperature: number;
  modelTopP: number;
  maxTokenCap: number;
  voiceEngine: VoiceEngineProfile;
  webhookCallbacks: WebhookCallback[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Voice synthesis engine parameters */
export interface VoiceEngineProfile {
  engineId: string;
  label: string;
  pitch: number;       // 0.0 - 2.0
  speed: number;       // 0.5 - 2.0
  gender: 'male' | 'female' | 'neutral';
  language: string;
}

/** Custom webhook callback endpoint mapping */
export interface WebhookCallback {
  id: string;
  label: string;
  url: string;
  event: 'on_transcription' | 'on_response' | 'on_error' | 'on_disconnect';
  isActive: boolean;
}

/** Extended network telemetry metrics for the high-density grid */
export interface NetworkTelemetryMetrics {
  p50LatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  activeConcurrentPipelines: number;
  audioThroughputKbps: number;
  tokenGenSpeedTps: number;
  tokenUsageTotal: number;
  estimatedCostUsd: number;
  failoverProPrimaryPercent: number;
  failoverFlashPercent: number;
  latencyHistory: number[];
  throughputHistory: number[];
  tokenHistory: number[];
  jitterHistory: number[];
  packetLossHistory: number[];
}

/** Billing tier model with quota tracking */
export interface BillingTierModel {
  tierId: string;
  tierName: string;
  pricePerMonth: number;
  includedVoiceMinutes: number;
  usedVoiceMinutes: number;
  overageRatePerMinute: number;
  includedTokens: number;
  usedTokens: number;
  overageRatePerToken: number;
  currentSpendUsd: number;
  projectedSpendUsd: number;
}

/** A single invoice line item for historical billing */
export interface InvoiceLineItem {
  id: string;
  date: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
}

/** Virtual phone number routing entry */
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

/** Voice call lifecycle phases for the simulation engine */
export type CallLifecyclePhase =
  | 'idle'
  | 'handshake'
  | 'user_speaking'
  | 'model_processing'
  | 'agent_speaking'
  | 'disconnecting'
  | 'disconnected';
