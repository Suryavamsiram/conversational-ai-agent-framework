/*
  # SwarmVoice AI - Part 2: Application Tables

  1. New Tables
    - `api_keys` - Organization-scoped API credentials
    - `voice_sessions` - Voice session tracking
    - `session_transcripts` - Real-time caption/transcript storage
    - `session_logs` - WebSocket frame log storage
    - `telemetry_snapshots` - Performance metrics time-series

  2. Security
    - All tables have RLS enabled
    - Access scoped to organization membership
    - API key mutations restricted to Admin role
    - Session data scoped to owning user
*/

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  scope text NOT NULL DEFAULT 'full' CHECK (scope IN ('full', 'read', 'write')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = api_keys.org_id)
  );

CREATE POLICY "Org admins can insert api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = api_keys.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can update api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = api_keys.org_id AND users.role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = api_keys.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can delete api keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = api_keys.org_id AND users.role = 'Admin')
  );

-- Voice Sessions
CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connecting', 'active', 'interrupted', 'disconnected')),
  backend text NOT NULL DEFAULT 'gemini-3.1-pro-preview',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own org sessions"
  ON voice_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = voice_sessions.org_id)
  );

CREATE POLICY "Users can insert own sessions"
  ON voice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON voice_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Session Transcripts
CREATE TABLE IF NOT EXISTS session_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'agent')),
  text text NOT NULL,
  is_streaming boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read session transcripts"
  ON session_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voice_sessions vs
      JOIN users u ON u.id = auth.uid() AND u.org_id = vs.org_id
      WHERE vs.id = session_transcripts.session_id
    )
  );

CREATE POLICY "Users can insert transcripts for own sessions"
  ON session_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_sessions WHERE voice_sessions.id = session_transcripts.session_id AND voice_sessions.user_id = auth.uid()
    )
  );

-- Session Logs
CREATE TABLE IF NOT EXISTS session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event text NOT NULL,
  payload text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read session logs"
  ON session_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voice_sessions vs
      JOIN users u ON u.id = auth.uid() AND u.org_id = vs.org_id
      WHERE vs.id = session_logs.session_id
    )
  );

CREATE POLICY "Users can insert logs for own sessions"
  ON session_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_sessions WHERE voice_sessions.id = session_logs.session_id AND voice_sessions.user_id = auth.uid()
    )
  );

-- Telemetry Snapshots
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  p50_latency_ms float NOT NULL DEFAULT 0,
  audio_throughput_kbps float NOT NULL DEFAULT 0,
  token_gen_speed_tps float NOT NULL DEFAULT 0,
  failover_pro_pct float NOT NULL DEFAULT 0,
  failover_flash_pct float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telemetry_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read telemetry"
  ON telemetry_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = telemetry_snapshots.org_id)
  );

CREATE POLICY "Users can insert telemetry for own org"
  ON telemetry_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = telemetry_snapshots.org_id)
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_org_id ON voice_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_transcripts_session_id ON session_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_snapshots_org_id ON telemetry_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Seed: Demo API keys for the enterprise org
INSERT INTO api_keys (id, org_id, name, key_hash, scope, status, created_at)
VALUES
  (gen_random_uuid(), '0ec090b5-7d6e-495f-cbda-19832f000001', 'Production API', 'sk_live_7a9fb3c2d4e1f0a8b6d5', 'full', 'active', '2026-05-15T10:00:00Z'),
  (gen_random_uuid(), '0ec090b5-7d6e-495f-cbda-19832f000001', 'Staging Read-Only', 'sk_live_2e8d4a1c7b3f9e0d5a6c', 'read', 'active', '2026-05-20T14:30:00Z'),
  (gen_random_uuid(), '0ec090b5-7d6e-495f-cbda-19832f000001', 'CI/CD Pipeline', 'sk_live_9c1e5b3a7d2f8a0e4b6c', 'write', 'active', '2026-05-28T09:15:00Z');
