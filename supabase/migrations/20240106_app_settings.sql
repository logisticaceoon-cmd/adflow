-- app_settings: global platform configuration (admin-only writes)
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default values
INSERT INTO app_settings (key, value) VALUES
  ('plan_prices',     '{"free": 0, "pro": 49, "agency": 149}'),
  ('maintenance_mode','false'),
  ('campaign_limits', '{"free": 3, "pro": 20, "agency": 100}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (needed for campaign limits enforcement)
CREATE POLICY "Authenticated users can read settings"
  ON app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can write
CREATE POLICY "Admins can update settings"
  ON app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
