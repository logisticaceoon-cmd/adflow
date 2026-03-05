-- ============================================================
-- ADFLOW - Esquema completo de base de datos
-- Ejecutar este SQL en Supabase → SQL Editor → New Query
-- ============================================================

-- 1. PERFILES DE USUARIO
-- Extiende la tabla de auth.users que crea Supabase automáticamente
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  company     TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
  report_email TEXT,
  report_time  TIME DEFAULT '08:00:00',
  report_active BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente cuando alguien se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, report_email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. CUENTAS DE FACEBOOK CONECTADAS
CREATE TABLE IF NOT EXISTS public.fb_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  fb_user_id      TEXT NOT NULL,
  fb_ad_account_id TEXT NOT NULL,   -- ej: act_123456789
  account_name    TEXT,
  currency        TEXT DEFAULT 'USD',
  timezone        TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  access_token    TEXT NOT NULL,    -- token de acceso de largo plazo
  token_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPAÑAS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  fb_account_id       UUID REFERENCES public.fb_accounts(id) ON DELETE SET NULL,
  -- IDs reales en Facebook (se llenan cuando se publica)
  fb_campaign_id      TEXT,
  fb_adset_id         TEXT,
  fb_ad_id            TEXT,
  -- Datos de la campaña
  name                TEXT NOT NULL,
  objective           TEXT NOT NULL,  -- CONVERSIONS, TRAFFIC, REACH, LEAD_GENERATION
  daily_budget        NUMERIC(10,2) NOT NULL,
  start_date          DATE,
  end_date            DATE,
  status              TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','error')),
  -- Contenido ingresado por el usuario
  product_description TEXT,
  product_url         TEXT,
  target_audience     TEXT,
  -- Copies generados por la IA (JSON con múltiples variantes)
  ai_copies           JSONB,
  -- Creativos (URLs de imágenes en Supabase Storage)
  creative_urls       TEXT[],
  -- Métricas (se actualiza diariamente)
  metrics             JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REPORTES DIARIOS
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_date       DATE NOT NULL,
  -- Snapshot de métricas del día (JSON con datos por campaña)
  metrics_snapshot  JSONB NOT NULL DEFAULT '{}',
  -- Análisis generado por Claude
  ai_analysis       TEXT,
  -- Recomendaciones estructuradas
  recommendations   JSONB DEFAULT '[]',
  -- Control de envío
  email_sent_at     TIMESTAMPTZ,
  email_status      TEXT DEFAULT 'pending' CHECK (email_status IN ('pending','sent','error')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- ============================================================
-- SEGURIDAD: Row Level Security (RLS)
-- Cada usuario solo puede ver y editar SUS propios datos
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios editan su propio perfil"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies para fb_accounts
CREATE POLICY "Usuarios ven sus cuentas FB"
  ON public.fb_accounts FOR ALL USING (auth.uid() = user_id);

-- Policies para campaigns
CREATE POLICY "Usuarios ven sus campañas"
  ON public.campaigns FOR ALL USING (auth.uid() = user_id);

-- Policies para daily_reports
CREATE POLICY "Usuarios ven sus reportes"
  ON public.daily_reports FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE: Bucket para creativos (imágenes/videos)
-- ============================================================

-- Ejecutar esto también en Supabase → Storage → New bucket
-- Nombre: 'creatives', Public: false
-- O usar este SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuarios suben sus propios archivos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios ven sus propios archivos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios borran sus propios archivos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);
