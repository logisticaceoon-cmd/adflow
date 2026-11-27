-- Daily campaign metrics: granular per-day performance data from Meta API
CREATE TABLE IF NOT EXISTS public.campaign_metrics_daily (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id         UUID NOT NULL,
  meta_campaign_id    TEXT,
  ad_account_id       TEXT,
  date                DATE NOT NULL,
  spend               NUMERIC(12,2) DEFAULT 0,
  impressions         INT DEFAULT 0,
  reach               INT DEFAULT 0,
  frequency           NUMERIC(6,2) DEFAULT 0,
  clicks              INT DEFAULT 0,
  ctr                 NUMERIC(6,4) DEFAULT 0,
  cpc                 NUMERIC(10,4) DEFAULT 0,
  cpm                 NUMERIC(10,4) DEFAULT 0,
  view_content        INT DEFAULT 0,
  add_to_cart         INT DEFAULT 0,
  initiate_checkout   INT DEFAULT 0,
  purchases           INT DEFAULT 0,
  purchase_value      NUMERIC(12,2) DEFAULT 0,
  roas                NUMERIC(8,2) DEFAULT 0,
  cpa                 NUMERIC(12,2) DEFAULT 0,
  phase               TEXT,
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

CREATE INDEX idx_cmd_user_date ON public.campaign_metrics_daily(user_id, date);

ALTER TABLE public.campaign_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily metrics"
  ON public.campaign_metrics_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily metrics"
  ON public.campaign_metrics_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily metrics"
  ON public.campaign_metrics_daily FOR UPDATE
  USING (auth.uid() = user_id);
