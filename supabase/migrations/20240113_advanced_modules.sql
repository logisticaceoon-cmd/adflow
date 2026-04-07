-- 20240113_advanced_modules.sql
-- Foundation tables for Phase 4 modules: autoscaling, forecast, AI strategist,
-- creative analysis, industry benchmarks. Tables are created but no runtime code
-- writes to them yet — engines are stubbed.

CREATE TABLE IF NOT EXISTS public.scaling_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  condition_metric TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value DECIMAL(12,4) NOT NULL,
  condition_period TEXT DEFAULT 'last_3d',
  action_type TEXT NOT NULL,
  action_value DECIMAL(12,4),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  cooldown_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scaling_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own rules" ON public.scaling_rules;
CREATE POLICY "Users manage own rules" ON public.scaling_rules FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.scaling_rule_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.scaling_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  condition_snapshot JSONB DEFAULT '{}',
  action_taken TEXT,
  result TEXT DEFAULT 'success',
  details JSONB DEFAULT '{}'
);

ALTER TABLE public.scaling_rule_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own rule logs" ON public.scaling_rule_logs;
CREATE POLICY "Users read own rule logs" ON public.scaling_rule_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access rule logs" ON public.scaling_rule_logs;
CREATE POLICY "Service role full access rule logs" ON public.scaling_rule_logs FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL,
  target_month TEXT NOT NULL,
  predicted_value DECIMAL(12,2),
  confidence_level DECIMAL(3,2),
  model_inputs JSONB DEFAULT '{}',
  actual_value DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, forecast_type, target_month)
);

ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own forecasts" ON public.forecasts;
CREATE POLICY "Users read own forecasts" ON public.forecasts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access forecasts" ON public.forecasts;
CREATE POLICY "Service role full access forecasts" ON public.forecasts FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context_type TEXT DEFAULT 'general',
  messages JSONB DEFAULT '[]',
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.creative_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id),
  creative_url TEXT,
  analysis_type TEXT,
  scores JSONB DEFAULT '{}',
  suggestions TEXT[],
  performance_correlation JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.creative_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own creative analysis" ON public.creative_analysis;
CREATE POLICY "Users read own creative analysis" ON public.creative_analysis FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access creative analysis" ON public.creative_analysis;
CREATE POLICY "Service role full access creative analysis" ON public.creative_analysis FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  country TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(12,4),
  sample_size INTEGER,
  period TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(industry, country, metric, period)
);
