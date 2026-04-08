// src/lib/scaling-evaluator.ts
// The second layer of the expert workbook's EVALUADOR_MASTER sheet.
// Breaks the scaling decision into 4 orthogonal blocks (A/B/C/C+), combines
// them, classifies risk, and outputs a suggested scale %.
//
// Blocks summary:
//   A — Is ROAS above minimum?                 (profitability)
//   B — Is frequency below the ceiling?        (audience saturation)
//   C — Is volume meaningful?                  (sample size)
//   C+ — Is the funnel healthy end-to-end?     (conversion ratios)
//
// Final decision:
//   • canScale = A ∧ B ∧ (C_final OR scaling_with_risk allowed)
//   • scale%  = derived from ROAS level, capped if risk is present
import {
  type StrategySettings,
  type RoasLevel,
  type FrequencyLevel,
  DEFAULT_SETTINGS,
  classifyRoasLevel,
  classifyFrequencyLevel,
  getScalePctByRoasLevel,
} from './strategy-settings'
import type { CampaignMetrics } from './diagnostic-rules'

export type RiskLevel =
  | 'OK'
  | 'FRECUENCIA_ALTA'
  | 'ROAS_BAJO'
  | 'EMBUDO_ROTO'
  | 'SIN_VOLUMEN'
  | 'DOBLE_ALERTA'

export interface ScalingEvaluation {
  // ── Block evaluation ──
  bloqueA:      boolean   // ROAS ≥ roas_min
  bloqueB:      boolean   // Frecuencia < frec_max
  bloqueC:      boolean   // Volumen: purchases ≥ min_compras AND addToCart ≥ min_carritos
  bloqueCplus:  boolean   // Embudo sano: ratios mínimos pago/compra
  bloqueCfinal: boolean   // C ∧ C+

  // ── Funnel ratios (for transparency) ──
  ratioPago: number        // initiateCheckout / addToCart
  ratioCompra: number      // purchases / initiateCheckout

  // ── Scaling decision ──
  canScale:          boolean
  scalePctSuggested: number

  // ── Classifications ──
  roasLevel:      RoasLevel
  frequencyLevel: FrequencyLevel
  riskLevel:      RiskLevel

  // ── Human-readable explanations ──
  motivo:        string  // why this decision
  motivoCplus:   string  // funnel health explanation
  notificacion:  string  // short client-facing notification
  risks:         string[]
}

export function evaluateScaling(
  metrics: CampaignMetrics,
  settings: StrategySettings = DEFAULT_SETTINGS,
): ScalingEvaluation {
  // ═══ BLOCK A — profitability ═══
  const bloqueA = metrics.roas >= settings.roas_min

  // ═══ BLOCK B — frequency ceiling ═══
  const bloqueB = metrics.frequency < settings.frec_max

  // ═══ BLOCK C — volume ═══
  const bloqueC =
    metrics.purchases >= settings.min_compras &&
    metrics.addToCart >= settings.min_carritos

  // ═══ BLOCK C+ — funnel health ═══
  const ratioPago   = metrics.addToCart > 0 ? metrics.initiateCheckout / metrics.addToCart : 0
  const ratioCompra = metrics.initiateCheckout > 0 ? metrics.purchases / metrics.initiateCheckout : 0
  const bloqueCplus =
    ratioPago >= settings.ratio_pago_min &&
    ratioCompra >= settings.ratio_compra_min

  const bloqueCfinal = bloqueC && bloqueCplus

  // ═══ Classifications ═══
  const roasLevel      = classifyRoasLevel(metrics.roas, settings)
  const frequencyLevel = classifyFrequencyLevel(metrics.frequency, settings)

  // ═══ Risk level ═══
  let riskLevel: RiskLevel = 'OK'
  const risks: string[] = []

  if (!bloqueA) {
    riskLevel = 'ROAS_BAJO'
    risks.push('ROAS bajo')
  }
  if (!bloqueB) {
    riskLevel = riskLevel === 'ROAS_BAJO' ? 'DOBLE_ALERTA' : 'FRECUENCIA_ALTA'
    risks.push('frecuencia alta')
  }
  if (bloqueA && bloqueB && !bloqueCfinal) {
    if (!bloqueC) {
      riskLevel = 'SIN_VOLUMEN'
      risks.push('volumen insuficiente')
    } else {
      riskLevel = 'EMBUDO_ROTO'
      risks.push('embudo con fricción')
    }
  }

  // ═══ Scaling decision ═══
  let canScale = false
  if (bloqueA && bloqueB && bloqueCfinal) {
    canScale = true // ideal path
  } else if (bloqueA && bloqueB && settings.escalado_con_riesgo) {
    canScale = true // allowed with controlled risk
  }

  // Scale % suggestion
  let scalePctSuggested = canScale ? getScalePctByRoasLevel(roasLevel, settings) : 0

  // If there is any risk, cap scaling at the minimum floor
  if (canScale && riskLevel !== 'OK') {
    scalePctSuggested = Math.min(scalePctSuggested, settings.min_pct_para_escalar)
  }

  // Mode bias
  if (settings.modo_escalado === 'CONSERVADOR' && canScale) {
    scalePctSuggested = Math.round(scalePctSuggested * 0.6)
  } else if (settings.modo_escalado === 'AGRESIVO' && canScale && riskLevel === 'OK') {
    scalePctSuggested = Math.min(
      Math.round(scalePctSuggested * 1.3),
      settings.porcentaje_max_escalado,
    )
  }

  // ═══ Funnel explanation ═══
  let motivoCplus: string
  if (bloqueCplus) {
    motivoCplus = 'Embudo rentable: los ratios pago y compra están sanos.'
  } else if (!bloqueC) {
    motivoCplus = `Volumen insuficiente: ${metrics.purchases} compras, ${metrics.addToCart} carritos (mínimo ${settings.min_compras}/${settings.min_carritos}).`
  } else if (ratioPago < settings.ratio_pago_min) {
    motivoCplus = `Fricción en checkout: solo ${(ratioPago * 100).toFixed(0)}% de carritos inician pago (mínimo ${(settings.ratio_pago_min * 100).toFixed(0)}%).`
  } else {
    motivoCplus = `Fricción en compra: solo ${(ratioCompra * 100).toFixed(0)}% de pagos se convierten (mínimo ${(settings.ratio_compra_min * 100).toFixed(0)}%).`
  }

  // ═══ Overall motive ═══
  let motivo: string
  if (canScale && riskLevel === 'OK') {
    motivo = 'Todos los indicadores son positivos. Escalado seguro.'
  } else if (canScale && riskLevel !== 'OK') {
    motivo = `Escalado permitido con precaución: ${risks.join(', ')}.`
  } else if (!bloqueA) {
    motivo = `ROAS (${metrics.roas.toFixed(1)}x) por debajo del mínimo (${settings.roas_min}x). No escalar.`
  } else if (!bloqueB) {
    motivo = `Frecuencia (${metrics.frequency.toFixed(1)}) supera el máximo (${settings.frec_max}). Audiencia saturada.`
  } else {
    motivo = `Embudo no sano: ${motivoCplus}`
  }

  // ═══ Client-facing short notification ═══
  let notificacion: string
  if (canScale && riskLevel === 'OK') {
    notificacion = '✅ Escalar permitido (escenario sano)'
  } else if (canScale) {
    notificacion = `🟡 Escalar con precaución: ${risks.join(', ')}`
  } else if (riskLevel === 'ROAS_BAJO') {
    notificacion = `🟠 ROAS bajo (<${settings.roas_min}x). No escalar. Optimizar creativos/oferta.`
  } else if (riskLevel === 'FRECUENCIA_ALTA') {
    notificacion = `🔴 Frecuencia alta (${metrics.frequency.toFixed(1)}). Audiencia saturada. Renovar público.`
  } else if (riskLevel === 'DOBLE_ALERTA') {
    notificacion = '🔴 ROAS bajo + frecuencia alta. Doble alerta. Considerar pausa.'
  } else if (riskLevel === 'EMBUDO_ROTO') {
    notificacion = '🟠 Embudo con fricción. Revisar checkout y proceso de compra.'
  } else if (riskLevel === 'SIN_VOLUMEN') {
    notificacion = '🟡 Volumen insuficiente. Esperar más datos.'
  } else {
    notificacion = '🟡 Observar. Datos insuficientes para decidir.'
  }

  return {
    bloqueA, bloqueB, bloqueC, bloqueCplus, bloqueCfinal,
    ratioPago, ratioCompra,
    canScale, scalePctSuggested,
    roasLevel, frequencyLevel, riskLevel,
    motivo, motivoCplus, notificacion, risks,
  }
}
