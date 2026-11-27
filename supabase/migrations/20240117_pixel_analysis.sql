-- Pixel analysis: stores pixel event data, level, and retargeting capabilities
CREATE TABLE IF NOT EXISTS public.pixel_analysis (
  id                        BIGSERIAL PRIMARY KEY,
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  pixel_id                  TEXT,
  events_data               JSONB DEFAULT '{}',
  level                     INT DEFAULT 0,
  level_name                TEXT DEFAULT 'Sin Data',
  can_retarget_view_content BOOLEAN DEFAULT FALSE,
  can_retarget_add_to_cart  BOOLEAN DEFAULT FALSE,
  can_retarget_purchase     BOOLEAN DEFAULT FALSE,
  can_create_lookalike      BOOLEAN DEFAULT FALSE,
  total_page_views_30d      INT DEFAULT 0,
  total_view_content_30d    INT DEFAULT 0,
  total_add_to_cart_30d     INT DEFAULT 0,
  total_purchases_30d       INT DEFAULT 0,
  total_purchases_180d      INT DEFAULT 0,
  purchase_value_30d        NUMERIC(12,2) DEFAULT 0,
  available_strategies      TEXT[] DEFAULT '{}',
  available_audience_types  TEXT[] DEFAULT '{}',
  analyzed_at               TIMESTAMPTZ DEFAULT NOW(),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pixel_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pixel_analysis"
  ON public.pixel_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pixel_analysis"
  ON public.pixel_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pixel_analysis"
  ON public.pixel_analysis FOR UPDATE
  USING (auth.uid() = user_id);
