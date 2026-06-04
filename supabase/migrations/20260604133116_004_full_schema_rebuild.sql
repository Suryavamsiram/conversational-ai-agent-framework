/*
  # SwarmVoice AI - Complete Schema (recreated with all fixes)

  1. New Tables
    - `organizations` - Company/workspace container
    - `users` - User profiles linked to orgs (with INSERT policy)
    - `api_keys` - Organization-scoped API credentials
    - `voice_sessions` - Voice session tracking
    - `session_transcripts` - Real-time caption/transcript storage
    - `session_logs` - WebSocket frame log storage
    - `telemetry_snapshots` - Performance metrics time-series

  2. Security
    - RLS enabled on ALL tables
    - Users can INSERT their own profile (fixes signup flow)
    - Service role can insert users/orgs (for auth trigger)
    - API key mutations restricted to Admin role
    - Session data scoped to owning user

  3. Triggers
    - Auto-create user profile + personal org on auth.users insert
*/

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'developer' CHECK (tier IN ('developer', 'scale', 'enterprise')),
  member_count int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users (profile table linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can read own org"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.org_id = organizations.id AND users.id = auth.uid())
  );

CREATE POLICY "Service role can insert organizations"
  ON organizations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- User policies (includes INSERT for signup)
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read peers in own org"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = users.org_id)
  );

CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_org_id ON voice_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_transcripts_session_id ON session_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_snapshots_org_id ON telemetry_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Auto-profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO organizations (name, tier, member_count)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'org_name', 'Personal Workspace'), 'developer', 1)
  RETURNING id INTO new_org_id;

  INSERT INTO users (id, email, name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'Admin',
    new_org_id
  );

  RETURN NEW;
END;
$$;

-- Trigger: auto-create profile + org on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
