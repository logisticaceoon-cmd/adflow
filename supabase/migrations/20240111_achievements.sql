-- 20240111_achievements.sql
-- Persistent achievements system: catalog + per-user unlock tracking.

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  threshold DECIMAL(12,2) DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  source_context JSONB DEFAULT '{}',
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_notified ON public.user_achievements(user_id, notified);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read definitions" ON public.achievement_definitions;
CREATE POLICY "Anyone can read definitions" ON public.achievement_definitions
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
CREATE POLICY "Users read own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access achievements" ON public.user_achievements;
CREATE POLICY "Service role full access achievements" ON public.user_achievements
  FOR ALL USING (true);

-- Seed catalog
INSERT INTO public.achievement_definitions (code, name, description, icon, category, condition_type, threshold, rarity, order_index) VALUES
  ('first_campaign', 'Primera campaña', 'Creaste tu primera campaña con IA', '🎯', 'hito', 'campaign_count', 1, 'common', 1),
  ('campaigns_5', '5 campañas', 'Ya tenés 5 campañas creadas', '📣', 'hito', 'campaign_count', 5, 'common', 2),
  ('campaigns_10', '10 campañas', 'Estratega activo con 10 campañas', '🏅', 'hito', 'campaign_count', 10, 'rare', 3),
  ('sales_10', 'Primeras 10 ventas', 'Tu negocio generó sus primeras 10 ventas', '🏆', 'ventas', 'purchases_total', 10, 'common', 10),
  ('sales_50', '50 ventas', 'Medio centenar de clientes satisfechos', '🌟', 'ventas', 'purchases_total', 50, 'rare', 11),
  ('sales_100', '100 ventas', 'Triple dígito. Tu negocio crece en serio.', '💎', 'ventas', 'purchases_total', 100, 'rare', 12),
  ('sales_500', '500 ventas', 'Medio millar. Estás escalando.', '🔥', 'ventas', 'purchases_total', 500, 'epic', 13),
  ('sales_1000', '1000 ventas', 'Mil ventas. Tu negocio es un imperio.', '👑', 'ventas', 'purchases_total', 1000, 'legendary', 14),
  ('first_roas_2x', 'ROAS rentable', 'Tu primera campaña con ROAS mayor a 2x', '📈', 'estrategia', 'roas_above', 2, 'common', 20),
  ('first_roas_3x', 'ROAS excelente', 'Campaña con ROAS mayor a 3x', '🚀', 'estrategia', 'roas_above', 3, 'rare', 21),
  ('first_roas_5x', 'ROAS legendario', 'Campaña con ROAS mayor a 5x', '⚡', 'estrategia', 'roas_above', 5, 'epic', 22),
  ('level_1', 'Explorador', 'Alcanzaste el Nivel 1', '🌱', 'nivel', 'level_reached', 1, 'common', 30),
  ('level_3', 'Estratega', 'Alcanzaste el Nivel 3', '🧠', 'nivel', 'level_reached', 3, 'rare', 31),
  ('level_5', 'Profesional', 'Alcanzaste el Nivel 5', '💼', 'nivel', 'level_reached', 5, 'epic', 32),
  ('level_7', 'Maestro', 'Alcanzaste el Nivel 7', '👑', 'nivel', 'level_reached', 7, 'legendary', 33),
  ('level_8', 'Imperio', 'Nivel máximo. Tu negocio es imparable.', '🏰', 'nivel', 'level_reached', 8, 'legendary', 34),
  ('mofu_unlocked', 'MOFU desbloqueado', 'Desbloqueaste estrategias de remarketing', '🎯', 'estrategia', 'level_reached', 3, 'rare', 40),
  ('bofu_unlocked', 'BOFU desbloqueado', 'Acceso completo a estrategias de conversión', '🚀', 'estrategia', 'level_reached', 5, 'epic', 41),
  ('lookalike_unlocked', 'Lookalike desbloqueado', 'Meta puede encontrar clientes similares', '🔮', 'estrategia', 'level_reached', 6, 'epic', 42),
  ('budget_set', 'Presupuesto planificado', 'Configuraste tu primer presupuesto mensual', '💰', 'hito', 'budget_set', 1, 'common', 50),
  ('first_sync', 'Datos sincronizados', 'Tu primera sincronización de métricas reales', '🔄', 'hito', 'first_sync', 1, 'common', 51),
  ('visits_1000', '1,000 visitas', 'Mil personas conocieron tu negocio', '🌐', 'hito', 'pageviews_total', 1000, 'common', 60),
  ('visits_10000', '10,000 visitas', 'Diez mil personas conocieron tu negocio', '🌍', 'hito', 'pageviews_total', 10000, 'rare', 61),
  ('first_profitable_month', 'Mes rentable', 'Tu primer mes con ROAS promedio mayor a 1', '💰', 'consistencia', 'monthly_roas_above', 1, 'rare', 70)
ON CONFLICT (code) DO NOTHING;
