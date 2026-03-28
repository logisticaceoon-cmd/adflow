-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Admin Roles + Supporting Tables
-- Idempotente: seguro para re-ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Columna role en profiles ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ─── 2. RLS para que admins lean todos los perfiles ───────────────────────────
-- Usar alias en subquery para evitar recursión
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (SELECT p2.role FROM profiles p2 WHERE p2.id = auth.uid()) IN ('admin', 'super_admin')
  );

-- ─── 3. ai_requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model         TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  endpoint      TEXT NOT NULL DEFAULT 'generate-copies',
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view ai_requests" ON ai_requests;
CREATE POLICY "Admins can view ai_requests" ON ai_requests FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users insert own ai_requests" ON ai_requests;
CREATE POLICY "Users insert own ai_requests" ON ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at DESC);

-- ─── 4. user_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event      TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view user_events" ON user_events;
CREATE POLICY "Admins can view user_events" ON user_events FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users insert own events" ON user_events;
CREATE POLICY "Users insert own events" ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);

-- ─── 5. Promover usuario a admin (ajustar email según necesidad) ──────────────
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'logisticaceoon@gmail.com');
