/*
  # SwarmVoice AI - Agent & Phone Routing Tables

  1. New Tables
    - `agent_profiles` - Voice agent behavioral configurations
    - `phone_routes` - Virtual phone number routing entries
    - `invoices` - Historical billing line items

  2. Security
    - RLS enabled on all tables
    - Access scoped to org membership
    - Agent mutations restricted to Admin role
*/

-- Agent Profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  model_temperature float NOT NULL DEFAULT 0.5,
  model_top_p float NOT NULL DEFAULT 0.9,
  max_token_cap int NOT NULL DEFAULT 4096,
  voice_pitch float NOT NULL DEFAULT 1.0,
  voice_speed float NOT NULL DEFAULT 1.0,
  voice_gender text NOT NULL DEFAULT 'neutral' CHECK (voice_gender IN ('male', 'female', 'neutral')),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read agent profiles"
  ON agent_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = agent_profiles.org_id)
  );

CREATE POLICY "Org admins can insert agent profiles"
  ON agent_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = agent_profiles.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can update agent profiles"
  ON agent_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = agent_profiles.org_id AND users.role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = agent_profiles.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can delete agent profiles"
  ON agent_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = agent_profiles.org_id AND users.role = 'Admin')
  );

-- Phone Routes
CREATE TABLE IF NOT EXISTS phone_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  assigned_agent_id uuid REFERENCES agent_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  monthly_cost float NOT NULL DEFAULT 0,
  minutes_used int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE phone_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read phone routes"
  ON phone_routes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = phone_routes.org_id)
  );

CREATE POLICY "Org admins can insert phone routes"
  ON phone_routes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = phone_routes.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can update phone routes"
  ON phone_routes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = phone_routes.org_id AND users.role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = phone_routes.org_id AND users.role = 'Admin')
  );

CREATE POLICY "Org admins can delete phone routes"
  ON phone_routes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = phone_routes.org_id AND users.role = 'Admin')
  );

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date text NOT NULL,
  description text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price float NOT NULL DEFAULT 0,
  total float NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = invoices.org_id)
  );

CREATE POLICY "Org admins can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.org_id = invoices.org_id AND users.role = 'Admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_profiles_org_id ON agent_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_phone_routes_org_id ON phone_routes(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
