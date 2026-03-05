CREATE TABLE business_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Sección 1: Assets de Meta
  selected_ad_account_id   TEXT,
  selected_ad_account_name TEXT,
  pixel_id                 TEXT,
  pixel_name               TEXT,
  fb_page_id               TEXT,
  fb_page_name             TEXT,
  instagram_account_id     TEXT,
  instagram_account_name   TEXT,

  -- Sección 2: Información del negocio
  business_name   TEXT,
  website_url     TEXT,
  whatsapp_number TEXT,
  industry        TEXT,
  country         TEXT,
  currency        TEXT DEFAULT 'USD',

  -- Sección 3: Activos creativos
  logo_url               TEXT,
  brand_color_primary    TEXT DEFAULT '#4f6ef7',
  brand_color_secondary  TEXT DEFAULT '#7c3aed',
  communication_tone     TEXT DEFAULT 'profesional',

  -- Sección 4: Defaults de campañas
  default_daily_budget  NUMERIC DEFAULT 50,
  default_objective     TEXT DEFAULT 'CONVERSIONS',
  default_whatsapp_cta  TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own business profile"
ON business_profiles FOR ALL
USING (auth.uid() = user_id);
