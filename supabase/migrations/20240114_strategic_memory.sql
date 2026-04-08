-- 20240114_strategic_memory.sql
-- Strategic memory system: decision history + user action log.
-- Powers the memory-engine.ts which feeds "smarts" back to the decision engine.

CREATE TABLE IF NOT EXISTS public.strategic_decision_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_action_id TEXT NOT NULL,
  primary_action_title TEXT NOT NULL,
  primary_action_priority TEXT NOT NULL,     -- 'critical' | 'important' | 'opportunity'
  primary_action_impact TEXT NOT NULL,       -- 'high' | 'medium' | 'low'
  primary_action_reason TEXT,
  secondary_action_ids TEXT[] DEFAULT '{}',
  action_status TEXT DEFAULT 'suggested',    -- 'suggested' | 'in_progress' | 'completed' | 'ignored' | 'superseded'
  context_snapshot JSONB DEFAULT '{}',
  clicked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pre_metrics JSONB,
  post_metrics JSONB,
  impact_score DECIMAL(8,2),                 -- percent delta vs pre_metrics
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                    -- after this point the decision is stale
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdh_user_status ON public.strategic_decision_history(user_id, action_status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sdh_user_action ON public.strategic_decision_history(user_id, primary_action_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sdh_user_recent ON public.strategic_decision_history(user_id, generated_at DESC);

ALTER TABLE public.strategic_decision_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own decisions" ON public.strategic_decision_history;
CREATE POLICY "Users read own decisions" ON public.strategic_decision_history
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access decisions" ON public.strategic_decision_history;
CREATE POLICY "Service role full access decisions" ON public.strategic_decision_history
  FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_actions_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,                 -- 'cta_click' | 'campaign_created' | 'budget_saved' | ...
  action_label TEXT,
  source TEXT DEFAULT 'dashboard',           -- 'dashboard' | 'pixel' | 'campaigns' | 'budget' | 'notification'
  target_url TEXT,
  related_entity_id TEXT,
  related_entity_type TEXT,
  context_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ual_user_recent ON public.user_actions_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_user_action ON public.user_actions_log(user_id, action_id, created_at DESC);

ALTER TABLE public.user_actions_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own action logs" ON public.user_actions_log;
CREATE POLICY "Users read own action logs" ON public.user_actions_log
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access action logs" ON public.user_actions_log;
CREATE POLICY "Service role full access action logs" ON public.user_actions_log
  FOR ALL USING (true);
