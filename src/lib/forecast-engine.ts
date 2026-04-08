// src/lib/forecast-engine.ts
// Forecast engine powered by the V1_0 expert intelligence engine.
//
// Generates 3 scenarios (Conservador, Crecimiento, Optimista) for the given
// target month based on the last 30 days of real metrics. Each scenario has
// an honest confidence score derived from how many evaluation blocks are
// positive, plus the risks and conditions that would need to hold for it to
// materialize.
//
// NOTE: the stub signatures (generateForecast, compareForecastVsActual,
// getForecasts) are preserved for retro-compatibility with anything that
// might have imported them in the past. The stubs previously logged "not
// implemented yet" — now the main function returns real results.
import { createAdminClient } from '@/lib/supabase/server'
import {
  analyzeCampaign,
  aggregateDailyMetrics,
  type CampaignIntelligenceResult,
} from './campaign-intelligence'
import { DEFAULT_SETTINGS, type StrategySettings } from './strategy-settings'
import type { CampaignMetrics } from './diagnostic-rules'

export interface ForecastScenario {
  /** Scenario short code */
  name: 'Conservador' | 'Crecimiento' | 'Optimista' | 'Sin datos'
  description: string
  projectedSpend: number
  projectedRevenue: number
  projectedRoas: number
  projectedPurchases: number
  projectedCpa: number
  /** Percentage of scale applied in this scenario (0 = no change) */
  scalePct: number
  /** Confidence 0-1 — how likely this scenario is to materialize */
  confidence: number
  risks: string[]
  conditions: string[]
}

export interface ForecastResult {
  userId: string
  targetMonth: string
  currentMetrics: {
    spend: number
    revenue: number
    roas: number
    purchases: number
    cpa: number
  }
  intelligence: CampaignIntelligenceResult | null
  scenarios: ForecastScenario[]
  recommendation: string
}

// ═══════════════════════════════════════════════════════════════
// PRIMARY API
// ═══════════════════════════════════════════════════════════════

export async function generateForecast(
  userId: string,
  targetMonth: string,
  settings: StrategySettings = DEFAULT_SETTINGS,
): Promise<ForecastResult> {
  try {
    const db = createAdminClient()

    // Pull last 30 days of daily metrics across all user campaigns
    const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const { data: dailyMetrics } = await db
      .from('campaign_metrics_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since)

    const rows = (dailyMetrics || []) as Array<Record<string, number | null>>

    // No data → return a single empty scenario and bail gracefully
    if (rows.length === 0) {
      return emptyForecast(userId, targetMonth)
    }

    // Aggregate 30-day snapshot
    const currentMetrics: CampaignMetrics = aggregateDailyMetrics(rows)

    // Analyze with the intelligence engine
    const intelligence = analyzeCampaign(currentMetrics, settings)

    // Build scenarios
    const scenarios: ForecastScenario[] = [
      buildConservativeScenario(currentMetrics),
      buildGrowthScenario(currentMetrics, intelligence),
      buildOptimisticScenario(currentMetrics, intelligence, settings),
    ]

    // Top-level recommendation
    const recommendation = buildRecommendation(intelligence)

    return {
      userId,
      targetMonth,
      currentMetrics: {
        spend:     currentMetrics.spend,
        revenue:   currentMetrics.revenue,
        roas:      currentMetrics.roas,
        purchases: currentMetrics.purchases,
        cpa:       currentMetrics.cpa,
      },
      intelligence,
      scenarios,
      recommendation,
    }
  } catch (err: any) {
    console.warn('[forecast-engine] generateForecast error:', err?.message || err)
    return emptyForecast(userId, targetMonth, `Error: ${err?.message || 'unknown'}`)
  }
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO BUILDERS
// ═══════════════════════════════════════════════════════════════

function buildConservativeScenario(m: CampaignMetrics): ForecastScenario {
  return {
    name: 'Conservador',
    description: 'Mantener el presupuesto actual sin cambios. Proyecta los últimos 30 días hacia adelante.',
    projectedSpend:     m.spend,
    projectedRevenue:   m.revenue,
    projectedRoas:      m.roas,
    projectedPurchases: m.purchases,
    projectedCpa:       m.cpa,
    scalePct:           0,
    confidence:         0.85,
    risks:              ['Crecimiento limitado'],
    conditions:         ['Mantener creativos y audiencias actuales'],
  }
}

function buildGrowthScenario(
  m: CampaignMetrics,
  intel: CampaignIntelligenceResult,
): ForecastScenario {
  if (!intel.canScale || intel.scalePctSuggested <= 0) {
    return {
      name: 'Crecimiento',
      description: 'El sistema no recomienda escalar en este momento.',
      projectedSpend:     m.spend,
      projectedRevenue:   m.revenue,
      projectedRoas:      m.roas,
      projectedPurchases: m.purchases,
      projectedCpa:       m.cpa,
      scalePct:           0,
      confidence:         0.60,
      risks:              [intel.motivo],
      conditions:         ['Mejorar métricas antes de escalar'],
    }
  }

  const scalePct = intel.scalePctSuggested
  const scaleFactor = 1 + scalePct / 100

  // Diminishing returns: efficiency drops when scaling.
  // • Clean risk → minor efficiency hit (0.95)
  // • Any risk  → bigger hit (0.85)
  const efficiencyDrop = intel.riskLevel === 'OK' ? 0.95 : 0.85

  const projectedSpend     = m.spend * scaleFactor
  const projectedRevenue   = m.revenue * scaleFactor * efficiencyDrop
  const projectedRoas      = m.roas * efficiencyDrop
  const projectedPurchases = Math.round(m.purchases * scaleFactor * efficiencyDrop)
  const projectedCpa       = projectedPurchases > 0 ? projectedSpend / projectedPurchases : 0

  return {
    name: 'Crecimiento',
    description: `Escalar presupuesto +${scalePct}% según evaluación del sistema.`,
    projectedSpend,
    projectedRevenue,
    projectedRoas,
    projectedPurchases,
    projectedCpa,
    scalePct,
    confidence: intel.riskLevel === 'OK' ? 0.70 : 0.50,
    risks:      intel.riskLevel !== 'OK' ? [intel.motivo] : [],
    conditions: [
      'Embudo se mantiene estable',
      'Frecuencia no sube significativamente',
      `ROAS se mantiene arriba de ${DEFAULT_SETTINGS.roas_min}x`,
    ],
  }
}

function buildOptimisticScenario(
  m: CampaignMetrics,
  intel: CampaignIntelligenceResult,
  settings: StrategySettings,
): ForecastScenario {
  const ev = intel.scalingEvaluation
  const ideal = ev.bloqueA && ev.bloqueB && ev.bloqueCfinal

  if (!ideal) {
    return {
      name: 'Optimista',
      description: 'No disponible: las condiciones actuales no soportan escalado agresivo.',
      projectedSpend:     m.spend,
      projectedRevenue:   m.revenue,
      projectedRoas:      m.roas,
      projectedPurchases: m.purchases,
      projectedCpa:       m.cpa,
      scalePct:           0,
      confidence:         0,
      risks:              [intel.motivo],
      conditions:         ['Todos los bloques de evaluación deben estar OK'],
    }
  }

  // Ideal conditions → propose double the suggested scale, capped at max
  const aggressivePct = Math.min(intel.scalePctSuggested * 2, settings.porcentaje_max_escalado)
  const scaleFactor = 1 + aggressivePct / 100

  // Aggressive scaling = bigger efficiency drop (0.88)
  const efficiencyDrop = 0.88
  const projectedSpend     = m.spend * scaleFactor
  const projectedRevenue   = m.revenue * scaleFactor * efficiencyDrop
  const projectedRoas      = m.roas * efficiencyDrop
  const projectedPurchases = Math.round(m.purchases * scaleFactor * efficiencyDrop)
  const projectedCpa       = projectedPurchases > 0 ? projectedSpend / projectedPurchases : 0

  return {
    name: 'Optimista',
    description: `Escalado agresivo +${aggressivePct}% — solo si todo se mantiene ideal.`,
    projectedSpend,
    projectedRevenue,
    projectedRoas,
    projectedPurchases,
    projectedCpa,
    scalePct:  aggressivePct,
    confidence: 0.35,
    risks: [
      'Rendimientos decrecientes posibles',
      'Frecuencia puede subir rápidamente',
    ],
    conditions: [
      'Todos los bloques de evaluación positivos',
      'Creativos frescos disponibles',
      'Audiencia no saturada',
      'Embudo sano sostenido',
    ],
  }
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION
// ═══════════════════════════════════════════════════════════════

function buildRecommendation(intel: CampaignIntelligenceResult): string {
  switch (intel.diagnosticType) {
    case 'Escalar':
      return 'El escenario de Crecimiento es viable. Considerá escalar de forma controlada.'
    case 'Pausar':
      return 'Priorizá el escenario Conservador. Hay señales de alerta que resolver primero.'
    case 'Optimizar':
      return 'Mantené el presupuesto (Conservador) y enfocate en optimizar antes de escalar.'
    case 'Observar':
    case 'Sin datos':
    default:
      return 'Esperá más datos antes de tomar decisiones de escalado.'
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACKS
// ═══════════════════════════════════════════════════════════════

function emptyForecast(userId: string, targetMonth: string, errorReason?: string): ForecastResult {
  return {
    userId,
    targetMonth,
    currentMetrics: { spend: 0, revenue: 0, roas: 0, purchases: 0, cpa: 0 },
    intelligence: null,
    scenarios: [
      {
        name: 'Sin datos',
        description: errorReason || 'No hay suficientes datos históricos para proyectar.',
        projectedSpend:     0,
        projectedRevenue:   0,
        projectedRoas:      0,
        projectedPurchases: 0,
        projectedCpa:       0,
        scalePct:           0,
        confidence:         0,
        risks:              [errorReason || 'Sin datos históricos'],
        conditions:         ['Necesitás al menos 1 mes de datos sincronizados'],
      },
    ],
    recommendation: 'Seguí generando datos para poder proyectar.',
  }
}

// ═══════════════════════════════════════════════════════════════
// LEGACY STUB SURFACE — preserved for retro-compat
// ═══════════════════════════════════════════════════════════════

/** Compares stored forecast predictions with actual month-end metrics.
 *  Still a stub — will be implemented when a forecast_history table exists. */
export async function compareForecastVsActual(userId: string, month: string): Promise<void> {
  console.log(`[forecast-engine] Stub: compareForecastVsActual(${userId}, ${month})`)
}

/** Returns previously generated forecasts for a user. Stub until the
 *  `forecasts` table has real data persisted by this engine. */
export async function getForecasts(userId: string, month?: string): Promise<ForecastResult[]> {
  console.log(`[forecast-engine] Stub: getForecasts(${userId}, ${month})`)
  return []
}
