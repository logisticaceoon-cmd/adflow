-- 20240115_automation_engine.sql
-- Automation rules + execution history with approval flow.
-- NOTE: this is a separate subsystem from the legacy `scaling_rules` /
-- `scaling_rule_logs` Phase 4 foundation tables, which never had data and
-- are preserved intact.

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What the rule targets
  entity_type TEXT NOT NULL DEFAULT 'campaign',
  entity_id UUID,

  -- Rule definition
  rule_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Flexible condition + action payloads
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',

  -- Control flags
  is_enabled BOOLEAN DEFAULT false,
  auto_execute BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT true,

  -- Cooldown / throttling
  cooldown_hours INTEGER DEFAULT 24,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  max_triggers INTEGER,

  -- Metadata
  source TEXT DEFAULT 'user',        -- 'user' | 'system' | 'template'
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_user_enabled ON public.automation_rules(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_ar_entity ON public.automation_rules(entity_id, entity_type);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own rules" ON public.automation_rules;
CREATE POLICY "Users manage own rules" ON public.automation_rules
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access automation rules" ON public.automation_rules;
CREATE POLICY "Service role full access automation rules" ON public.automation_rules
  FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,

  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'approved' | 'executed' | 'failed' | 'rejected' | 'expired'

  decision_snapshot JSONB DEFAULT '{}',
  before_state JSONB DEFAULT '{}',
  after_state JSONB DEFAULT '{}',

  result_message TEXT,
  error_message TEXT,

  requires_approval BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_user_status ON public.automation_executions(user_id, status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_rule ON public.automation_executions(rule_id, triggered_at DESC);

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own executions" ON public.automation_executions;
CREATE POLICY "Users read own executions" ON public.automation_executions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own executions" ON public.automation_executions;
CREATE POLICY "Users update own executions" ON public.automation_executions
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access executions" ON public.automation_executions;
CREATE POLICY "Service role full access executions" ON public.automation_executions
  FOR ALL USING (true);
