// src/lib/monthly-report-engine.ts
// Builds the consolidated monthly report for a user. Reads pixel + campaigns
// + monthly budget, computes phase metrics, asks Claude for an executive
// summary, and upserts into monthly_reports.
import { createAdminClient } from '@/lib/supabase/server'
import { generateRecommendations } from './recommendation-engine'
import type { Recommendation } from './recommendation-engine'
import type { PixelAnalysis } from './pixel-analyzer'
import Anthropic from '@anthropic-ai/sdk'

export interface MonthlyReport {
  monthYear: string
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  avgRoas: number
  avgCpa: number
  phaseMetrics: Record<string, { spend: number; revenue: number; roas: number; conversions: number; cpa: number }>
  pixelLevelStart: number
  pixelLevelEnd: number
  budgetPlanned: number
  budgetSpent: number
  budgetEfficiency: number
  growthRate: number
  campaignsCreated: number
  campaignsActive: number
  aiAnalysis: string
  recommendations: Recommendation[]
}

const STRATEGY_TO_PHASE: Record<string, string> = { TOFU: 'F1', MOFU: 'F3', BOFU: 'F2' }

export async function generateMonthlyReport(
  userId: string,
  monthYear?: string,
): Promise<MonthlyReport> {
  const db = createAdminClient()
  const now = new Date()
  const targetMonth = monthYear || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Date range for the target month
  const [yearStr, monthStr] = targetMonth.split('-')
  const year = Number(yearStr)
  const monthIdx = Number(monthStr) - 1
  const firstDay = new Date(year, monthIdx, 1).toISOString()
  const lastDay  = new Date(year, monthIdx + 1, 1).toISOString()

  // Previous month (for growth rate)
  const prevDate = new Date(year, monthIdx - 1, 1)
  const prevMonthYear = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  // 1) Campaigns created during the month
  const { data: campaigns } = await db
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', firstDay)
    .lt('created_at', lastDay)

  // 2) Pixel snapshot (current state)
  const { data: pixelData } = await db
    .from('pixel_analysis')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // 3) Level at the start of the month
  const { data: levelStart } = await db
    .from('level_history')
    .select('new_level')
    .eq('user_id', userId)
    .lte('created_at', firstDay)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 4) Monthly budget
  const { data: budget } = await db
    .from('monthly_budgets')
    .select('total_budget')
    .eq('user_id', userId)
    .eq('month_year', targetMonth)
    .maybeSingle()

  // 5) Aggregate metrics across campaigns
  const all = (campaigns || []) as Array<{ name: string; status: string; strategy_type: string | null; daily_budget: number; metrics: any }>
  const totalSpend       = all.reduce((s, c) => s + (c.metrics?.spend       || 0), 0)
  const totalRevenue     = all.reduce((s, c) => s + ((c.metrics?.roas || 0) * (c.metrics?.spend || 0)), 0)
  const totalConversions = all.reduce((s, c) => s + (c.metrics?.conversions || 0), 0)
  const avgRoas = totalSpend       > 0 ? totalRevenue / totalSpend       : 0
  const avgCpa  = totalConversions > 0 ? totalSpend   / totalConversions : 0

  // 6) Per-phase metrics
  const phaseMetrics: Record<string, { spend: number; revenue: number; roas: number; conversions: number; cpa: number }> = {}
  for (const c of all) {
    const ph = STRATEGY_TO_PHASE[c.strategy_type || ''] || 'F1'
    if (!phaseMetrics[ph]) phaseMetrics[ph] = { spend: 0, revenue: 0, roas: 0, conversions: 0, cpa: 0 }
    const spend = c.metrics?.spend || 0
    phaseMetrics[ph].spend       += spend
    phaseMetrics[ph].conversions += c.metrics?.conversions || 0
    phaseMetrics[ph].revenue     += (c.metrics?.roas || 0) * spend
  }
  for (const ph of Object.keys(phaseMetrics)) {
    const p = phaseMetrics[ph]
    p.roas = p.spend       > 0 ? p.revenue / p.spend       : 0
    p.cpa  = p.conversions > 0 ? p.spend   / p.conversions : 0
  }

  // 7) Budget efficiency
  const budgetPlanned    = (budget?.total_budget as number) || 0
  const budgetEfficiency = budgetPlanned > 0 ? (totalSpend / budgetPlanned) * 100 : 0

  // 8) Growth rate vs previous month report
  const { data: prevReport } = await db
    .from('monthly_reports')
    .select('total_conversions')
    .eq('user_id', userId)
    .eq('month_year', prevMonthYear)
    .maybeSingle()
  const prevConversions = (prevReport?.total_conversions as number) || 0
  const growthRate = prevConversions > 0
    ? ((totalConversions - prevConversions) / prevConversions) * 100
    : 0

  // 9) AI executive summary
  let aiAnalysis = ''
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = `Sos un consultor de growth marketing para e-commerce LATAM. Analizá este reporte mensual y dá un resumen ejecutivo de 3-4 oraciones + 3 acciones concretas para el próximo mes.

Datos del mes (${targetMonth}):
- Nivel del pixel: ${pixelData?.level || 0} (${pixelData?.level_name || 'Sin Data'})
- Gasto total: $${totalSpend.toFixed(2)}
- Revenue estimado: $${totalRevenue.toFixed(2)}
- ROAS promedio: ${avgRoas.toFixed(2)}x
- Conversiones: ${totalConversions}
- CPA promedio: $${avgCpa.toFixed(2)}
- Campañas creadas: ${all.length}
- Presupuesto planeado: $${budgetPlanned}
- Eficiencia de presupuesto: ${budgetEfficiency.toFixed(0)}%
- Crecimiento vs mes anterior: ${growthRate.toFixed(0)}%

Respondé en español, directo y accionable. Sin formato markdown, solo texto plano.`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    aiAnalysis = msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch {
    aiAnalysis = 'Análisis IA no disponible este mes.'
  }

  // 10) Recommendations
  const pixelAnalysis: PixelAnalysis | null = pixelData ? {
    pixelId: pixelData.pixel_id,
    events:  pixelData.events_data,
    level:   pixelData.level ?? 0,
    levelName: pixelData.level_name ?? 'Sin Data',
    canRetargetViewContent: !!pixelData.can_retarget_view_content,
    canRetargetAddToCart:   !!pixelData.can_retarget_add_to_cart,
    canRetargetPurchase:    !!pixelData.can_retarget_purchase,
    canCreateLookalike:     !!pixelData.can_create_lookalike,
    availableStrategies:     pixelData.available_strategies     || ['TOFU'],
    availableAudienceTypes:  pixelData.available_audience_types || ['broad'],
    recommendations: [],
  } : null
  const recs = generateRecommendations(
    pixelAnalysis,
    all.map(c => ({ name: c.name, status: c.status, strategy_type: c.strategy_type, daily_budget: c.daily_budget, metrics: c.metrics })),
    budget as any,
  )

  const report: MonthlyReport = {
    monthYear: targetMonth,
    totalSpend, totalRevenue, totalConversions, avgRoas, avgCpa,
    phaseMetrics,
    pixelLevelStart: levelStart?.new_level || 0,
    pixelLevelEnd:   pixelData?.level      || 0,
    budgetPlanned, budgetSpent: totalSpend, budgetEfficiency,
    growthRate,
    campaignsCreated: all.length,
    campaignsActive:  all.filter(c => c.status === 'active').length,
    aiAnalysis, recommendations: recs,
  }

  // 11) Persist
  await db.from('monthly_reports').upsert({
    user_id: userId,
    month_year: targetMonth,
    total_spend: totalSpend,
    total_revenue: totalRevenue,
    total_conversions: totalConversions,
    avg_roas: avgRoas,
    avg_cpa: avgCpa,
    phase_metrics: phaseMetrics,
    pixel_level_start: levelStart?.new_level || 0,
    pixel_level_end:   pixelData?.level      || 0,
    pixel_events_snapshot: pixelData?.events_data || {},
    budget_planned: budgetPlanned,
    budget_spent: totalSpend,
    budget_efficiency: budgetEfficiency,
    growth_rate: growthRate,
    ai_analysis: aiAnalysis,
    recommendations: recs,
    campaigns_created: all.length,
    campaigns_active:  all.filter(c => c.status === 'active').length,
  }, { onConflict: 'user_id,month_year' })

  return report
}
