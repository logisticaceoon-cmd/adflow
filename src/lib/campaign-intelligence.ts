// src/lib/campaign-intelligence.ts
// Central intelligence engine: combines diagnostic rules, scaling evaluation,
// and client messaging into a single analysis result. Everything the UI and
// decision engine need to know about a campaign in one shot.
import {
  DEFAULT_SETTINGS,
  type StrategySettings,
  type RoasLevel,
  type FrequencyLevel,
  ROAS_LEVEL_LABEL,
  FREQUENCY_LEVEL_LABEL,
} from './strategy-settings'
import {
  evaluateDiagnosticRules,
  type CampaignMetrics,
  type DiagnosticType,
} from './diagnostic-rules'
import {
  evaluateScaling,
  type ScalingEvaluation,
  type RiskLevel,
} from './scaling-evaluator'
import {
  generatePersonalizedMessage,
  type ClientMessage,
} from './client-message-engine'

export type NextActionType = 'scale' | 'pause' | 'optimize' | 'observe' | 'none'
export type NextActionUrgency = 'high' | 'medium' | 'low'

export interface NextBestCampaignAction {
  type: NextActionType
  label: string
  description: string
  urgency: NextActionUrgency
}

export interface CampaignIntelligenceResult {
  // ── Diagnosis (layer 1: rule match) ──
  diagnosticType: DiagnosticType | 'Sin datos'
  ruleId: string | null
  rulePriority: number
  ruleLabel: string | null

  // ── Scaling evaluation (layer 2: blocks + decision) ──
  canScale: boolean
  scalePctSuggested: number
  scalingEvaluation: ScalingEvaluation

  // ── Risk + classification ──
  riskLevel: RiskLevel
  roasLevel: RoasLevel
  roasLevelLabel: string
  frequencyLevel: FrequencyLevel
  frequencyLevelLabel: string

  // ── Narrative explanations ──
  reasonSummary: string
  motivo: string
  motivoEmbudo: string
  notificacion: string

  // ── Client-ready message ──
  clientMessage: ClientMessage | null

  // ── Next best action for this specific campaign ──
  nextBestAction: NextBestCampaignAction

  // ── Raw metrics (for traceability) ──
  metrics: CampaignMetrics
}

export function analyzeCampaign(
  metrics: CampaignMetrics,
  settings: StrategySettings = DEFAULT_SETTINGS,
): CampaignIntelligenceResult {
  // 1. Diagnostic rule matching
  const diagnosis = evaluateDiagnosticRules(metrics, settings)

  // 2. Scaling evaluation (A/B/C/C+ blocks)
  const scaling = evaluateScaling(metrics, settings)

  // 3. Client message — prefer the matched rule's template, fall back to T01
  const templateId = diagnosis.matched && diagnosis.rule ? diagnosis.rule.templateId : 'T01'
  const clientMessage = generatePersonalizedMessage(templateId, {
    roas: metrics.roas,
    frequency: metrics.frequency,
    purchases: metrics.purchases,
    spend: metrics.spend,
  })

  // 4. Diagnostic type fallback
  const diagnosticType: CampaignIntelligenceResult['diagnosticType'] = diagnosis.matched && diagnosis.rule
    ? diagnosis.rule.type
    : (metrics.spend > 0 ? 'Observar' : 'Sin datos')

  // 5. Reason summary
  const reasonSummary =
    `ROAS: ${metrics.roas.toFixed(1)}x · ` +
    `Frec: ${metrics.frequency.toFixed(1)} · ` +
    `Compras: ${metrics.purchases} · ` +
    `Riesgo: ${scaling.riskLevel} · ` +
    `Motivo: ${scaling.motivo}`

  // 6. Next best action inference
  let nextBestAction: NextBestCampaignAction

  if (diagnosticType === 'Escalar' && scaling.canScale) {
    nextBestAction = {
      type: 'scale',
      label: `Escalar presupuesto +${scaling.scalePctSuggested}%`,
      description: scaling.notificacion,
      urgency: scaling.riskLevel === 'OK' ? 'medium' : 'low',
    }
  } else if (diagnosticType === 'Pausar') {
    nextBestAction = {
      type: 'pause',
      label: 'Considerar pausar esta campaña',
      description: scaling.notificacion,
      urgency: 'high',
    }
  } else if (diagnosticType === 'Optimizar') {
    nextBestAction = {
      type: 'optimize',
      label: clientMessage?.subject || 'Optimizar esta campaña',
      description: scaling.notificacion,
      urgency: 'medium',
    }
  } else if (diagnosticType === 'Observar') {
    nextBestAction = {
      type: 'observe',
      label: 'Observar y esperar más datos',
      description: scaling.notificacion,
      urgency: 'low',
    }
  } else {
    nextBestAction = {
      type: 'none',
      label: 'Sin datos suficientes',
      description: 'Esperá al primer sync de métricas.',
      urgency: 'low',
    }
  }

  return {
    diagnosticType,
    ruleId:       diagnosis.matched && diagnosis.rule ? diagnosis.rule.id : null,
    rulePriority: diagnosis.matched && diagnosis.rule ? diagnosis.rule.priority : 0,
    ruleLabel:    diagnosis.matched && diagnosis.rule ? diagnosis.rule.label : null,

    canScale:          scaling.canScale,
    scalePctSuggested: scaling.scalePctSuggested,
    scalingEvaluation: scaling,

    riskLevel:           scaling.riskLevel,
    roasLevel:           scaling.roasLevel,
    roasLevelLabel:      ROAS_LEVEL_LABEL[scaling.roasLevel],
    frequencyLevel:      scaling.frequencyLevel,
    frequencyLevelLabel: FREQUENCY_LEVEL_LABEL[scaling.frequencyLevel],

    reasonSummary,
    motivo:       scaling.motivo,
    motivoEmbudo: scaling.motivoCplus,
    notificacion: scaling.notificacion,

    clientMessage,
    nextBestAction,
    metrics,
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER — build CampaignMetrics from raw Supabase campaign row
// ═══════════════════════════════════════════════════════════════

/** Convenience: construct a CampaignMetrics from the fields commonly stored
 *  in `campaigns.metrics` (the JSONB summary written by the meta sync engine). */
export function buildMetricsFromCampaignRow(row: {
  metrics?: Record<string, unknown> | null
}): CampaignMetrics {
  const m = (row.metrics || {}) as Record<string, number | undefined>
  const spend = Number(m.spend || 0)
  const impressions = Number(m.impressions || 0)
  const clicks = Number(m.clicks || 0)
  const purchases = Number(m.conversions || m.purchases || 0)
  const revenue = Number(m.revenue || 0)
  return {
    spend,
    purchases,
    revenue,
    roas: Number(m.roas || 0),
    cpa: Number(m.cpa || 0),
    addToCart: Number(m.add_to_cart || 0),
    initiateCheckout: Number(m.initiate_checkout || 0),
    ctr: Number(m.ctr || 0),
    frequency: Number(m.frequency || 0),
    cpm: Number(m.cpm || 0),
    viewContent: Number(m.view_content || 0),
    impressions,
    clicks,
    reach: Number(m.reach || 0),
  }
}

/** Aggregate a list of campaign_metrics_daily rows (last N days) into one
 *  CampaignMetrics snapshot. Used by the forecast engine and intelligence API. */
export function aggregateDailyMetrics(
  rows: Array<Record<string, number | null>>,
): CampaignMetrics {
  if (!rows?.length) {
    return {
      spend: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0,
      addToCart: 0, initiateCheckout: 0, ctr: 0, frequency: 0,
      cpm: 0, viewContent: 0, impressions: 0, clicks: 0, reach: 0,
    }
  }

  let spend = 0, impressions = 0, clicks = 0
  let purchases = 0, revenue = 0
  let addToCart = 0, initiateCheckout = 0, viewContent = 0, reach = 0
  let freqSum = 0, freqDays = 0

  for (const r of rows) {
    spend            += Number(r.spend || 0)
    impressions      += Number(r.impressions || 0)
    clicks           += Number(r.clicks || 0)
    purchases        += Number(r.purchases || 0)
    revenue          += Number(r.purchase_value || 0)
    addToCart        += Number(r.add_to_cart || 0)
    initiateCheckout += Number(r.initiate_checkout || 0)
    viewContent      += Number(r.view_content || 0)
    reach            += Number(r.reach || 0)
    if (r.frequency) { freqSum += Number(r.frequency); freqDays++ }
  }

  return {
    spend,
    purchases,
    revenue,
    roas:      spend > 0 ? revenue / spend : 0,
    cpa:       purchases > 0 ? spend / purchases : 0,
    addToCart,
    initiateCheckout,
    ctr:       impressions > 0 ? (clicks / impressions) * 100 : 0,
    frequency: freqDays > 0 ? freqSum / freqDays : 0,
    cpm:       impressions > 0 ? (spend / impressions) * 1000 : 0,
    viewContent,
    impressions,
    clicks,
    reach,
  }
}
