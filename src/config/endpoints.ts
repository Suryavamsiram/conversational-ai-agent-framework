/**
 * Decoupled Integration & Configuration Network Layer
 *
 * All network routing paths are isolated here.
 * UI components must NEVER contain hardcoded fetch/WebSocket URLs.
 * To connect to the FastAPI backend, update this single configuration map.
 */

export const ENDPOINTS = {
  /** Real-time binary audio stream WebSocket */
  WS_AUDIO_STREAM: '/ws/audio/stream',

  /** Incoming real-time transcription webhook payload socket */
  WEBHOOK_TRANSCRIPTION_GATEWAY: '/ws/webhook/transcription',

  /** Outgoing text/audio generation webhook event socket */
  WEBHOOK_MODEL_RESPONSE_GATEWAY: '/ws/webhook/model-response',

  /** System health, usage data, and metrics REST endpoints */
  API_TELEMETRY_ANALYTICS: '/api/telemetry/analytics',

  /** CRUD data path for agent behavioral matrices */
  API_AGENT_PROFILES: '/api/agents/profiles',

  /** SaaS usage counters and platform cost streams */
  API_BILLING_METRICS: '/api/billing/metrics',

  /** Phone number routing and virtual line management */
  API_PHONE_ROUTING: '/api/phone/routing',

  /** Authentication endpoints */
  API_AUTH_SIGNIN: '/api/auth/signin',
  API_AUTH_SIGNUP: '/api/auth/signup',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;

/**
 * Resolves an endpoint key to a full URL.
 * In production, prepend the API base URL.
 * In development, returns the path for mock handling.
 */
export function resolveEndpoint(key: EndpointKey): string {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}${ENDPOINTS[key]}`;
}
