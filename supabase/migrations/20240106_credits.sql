-- ── Credits system ─────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS credits_total INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_date TIMESTAMPTZ DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month';

-- Tabla de historial de uso de créditos
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON credit_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own usage" ON credit_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Backfill credits_total según plan existente para usuarios ya registrados
UPDATE profiles SET credits_total = CASE
  WHEN plan = 'starter' THEN 100
  WHEN plan = 'pro'     THEN 400
  WHEN plan = 'agency'  THEN 1000
  ELSE 10
END
WHERE credits_total = 10 OR credits_total IS NULL;

-- Función auxiliar para incremento atómico de créditos
CREATE OR REPLACE FUNCTION increment_credits_used(p_user_id UUID)
RETURNS void AS $$
  UPDATE profiles SET credits_used = credits_used + 1 WHERE id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Función para cambiar plan y ajustar créditos totales (uso admin)
CREATE OR REPLACE FUNCTION admin_set_plan(p_user_id UUID, p_plan TEXT)
RETURNS void AS $$
  UPDATE profiles SET
    plan = p_plan,
    credits_total = CASE p_plan
      WHEN 'starter' THEN 100
      WHEN 'pro'     THEN 400
      WHEN 'agency'  THEN 1000
      ELSE 10
    END
  WHERE id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;
