-- Monthly reports: auto-generated monthly performance snapshots
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id                      BIGSERIAL PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year              TEXT NOT NULL, -- format: YYYY-MM
  total_spend             NUMERIC(12,2) DEFAULT 0,
  total_revenue           NUMERIC(12,2) DEFAULT 0,
  total_conversions       INT DEFAULT 0,
  avg_roas                NUMERIC(8,2) DEFAULT 0,
  avg_cpa                 NUMERIC(12,2) DEFAULT 0,
  phase_metrics           JSONB DEFAULT '{}',
  pixel_level_start       INT DEFAULT 0,
  pixel_level_end         INT DEFAULT 0,
  pixel_events_snapshot   JSONB DEFAULT '{}',
  budget_planned          NUMERIC(12,2) DEFAULT 0,
  budget_spent            NUMERIC(12,2) DEFAULT 0,
  budget_efficiency       NUMERIC(8,2) DEFAULT 0,
  growth_rate             NUMERIC(8,2) DEFAULT 0,
  ai_analysis             TEXT,
  recommendations         JSONB DEFAULT '[]',
  campaigns_created       INT DEFAULT 0,
  campaigns_active        INT DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON public.monthly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.monthly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.monthly_reports FOR UPDATE
  USING (auth.uid() = user_id);
