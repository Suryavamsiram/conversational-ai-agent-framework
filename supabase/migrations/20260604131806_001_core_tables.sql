/*
  # SwarmVoice AI - Part 1: Core Tables

  1. New Tables
    - `organizations` - Company/workspace container
    - `users` - User profiles linked to auth.users and orgs

  2. Security
    - RLS enabled on both tables
    - Users can read their own org (via membership check)
    - Users can INSERT their own profile (fixes signup flow)
    - Users can read/update own profile
    - Users can read peers in same org
    - Service role can insert orgs/users (for auth trigger)
*/

-- Organizations (created first, no FK dependency)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'developer' CHECK (tier IN ('developer', 'scale', 'enterprise')),
  member_count int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users (created second, references organizations)
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
