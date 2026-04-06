// src/app/api/recommendations/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecommendations } from '@/lib/recommendation-engine'
import type { PixelAnalysis } from '@/lib/pixel-analyzer'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Pixel analysis
  const { data: pa } = await supabase
    .from('pixel_analysis')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const pixelAnalysis: PixelAnalysis | null = pa ? {
    pixelId: pa.pixel_id,
    events: pa.events_data,
    level: pa.level ?? 0,
    levelName: pa.level_name ?? 'Sin Data',
    canRetargetViewContent: !!pa.can_retarget_view_content,
    canRetargetAddToCart: !!pa.can_retarget_add_to_cart,
    canRetargetPurchase: !!pa.can_retarget_purchase,
    canCreateLookalike: !!pa.can_create_lookalike,
    availableStrategies: pa.available_strategies || ['TOFU'],
    availableAudienceTypes: pa.available_audience_types || ['broad'],
    recommendations: [],
  } : null

  // Active campaigns + metrics
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('name, status, strategy_type, daily_budget, metrics')
    .eq('user_id', user.id)

  // Current month budget
  const monthYear = new Date().toISOString().slice(0, 7)
  const { data: budget } = await supabase
    .from('monthly_budgets')
    .select('total_budget, phase_budgets, phase_results')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .maybeSingle()

  const recommendations = generateRecommendations(
    pixelAnalysis,
    (campaigns || []) as any[],
    budget || undefined,
  )
  return NextResponse.json({ recommendations })
}
