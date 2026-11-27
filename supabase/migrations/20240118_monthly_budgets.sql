-- Monthly budgets: stores monthly budget planning per user
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id                         BIGSERIAL PRIMARY KEY,
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year                 TEXT NOT NULL, -- format: YYYY-MM
  total_budget               NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency                   TEXT DEFAULT 'USD',
  avg_ticket                 NUMERIC(12,2),
  margin_pct                 NUMERIC(5,2),
  target_roas                NUMERIC(5,2),
  phase_budgets              JSONB DEFAULT '{}',
  phase_budgets_recommended  JSONB DEFAULT '{}',
  phase_results              JSONB DEFAULT '{}',
  objective                  TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own budgets"
  ON public.monthly_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.monthly_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.monthly_budgets FOR UPDATE
  USING (auth.uid() = user_id);
