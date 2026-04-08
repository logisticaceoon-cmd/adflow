// src/lib/strategy-settings.ts
// Strategy thresholds extracted from the expert evaluation workbook (V1_0).
// These govern every downstream decision: diagnostic rules, scaling blocks,
// risk classification, message templates, forecast scenarios.
//
// Defaults mirror the workbook's SETTINGS sheet. They can be overridden per
// user in the future by reading from a `user_strategy_settings` table.

export type ScalingMode = 'EXPLORACION' | 'CONSERVADOR' | 'AGRESIVO'
export type RoasLevel = 'NO_RENTABLE' | 'RENTABLE' | 'VIABLE' | 'AGRESIVO'
export type FrequencyLevel = 'SUAVE' | 'MODERADA' | 'ALTA'

export interface StrategySettings {
  /** Average ticket value (used as CPA threshold in R09) */
  ticket_promedio: number
  /** Minimum ROAS to consider a campaign profitable */
  roas_min: number          // 4
  /** ROAS ≥ this is "viable" — scalable with care */
  roas_viable: number       // 7
  /** ROAS ≥ this is "aggressive" — scale hard */
  roas_agresivo: number     // 10
  /** Maximum acceptable frequency before audience is saturated */
  frec_max: number          // 4
  /** Frequency above this is a risk flag */
  frec_riesgo: number       // 3
  /** Minimum purchases to consider data statistically meaningful */
  min_compras: number       // 4
  /** Minimum add-to-carts to evaluate funnel health */
  min_carritos: number      // 30
  /** Minimum % of carts that must reach checkout (funnel health) */
  ratio_pago_min: number    // 0.30
  /** Minimum % of checkouts that must convert (funnel health) */
  ratio_compra_min: number  // 0.30
  /** Allow controlled scaling even when risk flags are present */
  escalado_con_riesgo: boolean // true
  /** Maximum scaling % allowed in a single step */
  porcentaje_max_escalado: number // 100
  /** Global scaling mode — affects aggressiveness bias */
  modo_escalado: ScalingMode
  /** Minimum scaling % suggested (floor) */
  min_pct_para_escalar: number // 20
}

export const DEFAULT_SETTINGS: StrategySettings = {
  ticket_promedio: 29000,
  roas_min: 4,
  roas_viable: 7,
  roas_agresivo: 10,
  frec_max: 4,
  frec_riesgo: 3,
  min_compras: 4,
  min_carritos: 30,
  ratio_pago_min: 0.30,
  ratio_compra_min: 0.30,
  escalado_con_riesgo: true,
  porcentaje_max_escalado: 100,
  modo_escalado: 'EXPLORACION',
  min_pct_para_escalar: 20,
}

// ═══════════════════════════════════════════════════════════════
// CLASSIFIERS
// ═══════════════════════════════════════════════════════════════

export function classifyRoasLevel(roas: number, settings: StrategySettings = DEFAULT_SETTINGS): RoasLevel {
  if (roas < settings.roas_min)     return 'NO_RENTABLE'
  if (roas < settings.roas_viable)  return 'RENTABLE'
  if (roas < settings.roas_agresivo) return 'VIABLE'
  return 'AGRESIVO'
}

export function classifyFrequencyLevel(freq: number, settings: StrategySettings = DEFAULT_SETTINGS): FrequencyLevel {
  if (freq < settings.frec_riesgo) return 'SUAVE'
  if (freq < settings.frec_max)    return 'MODERADA'
  return 'ALTA'
}

/** Scaling % suggestion based on ROAS level. */
export function getScalePctByRoasLevel(level: RoasLevel, settings: StrategySettings = DEFAULT_SETTINGS): number {
  switch (level) {
    case 'NO_RENTABLE': return 0
    case 'RENTABLE':    return settings.min_pct_para_escalar           // 20%
    case 'VIABLE':      return 50
    case 'AGRESIVO':    return settings.porcentaje_max_escalado        // 100%
  }
}

/** Human-readable label per ROAS level for UI surfaces. */
export const ROAS_LEVEL_LABEL: Record<RoasLevel, string> = {
  NO_RENTABLE: 'No rentable',
  RENTABLE:    'Rentable',
  VIABLE:      'Viable',
  AGRESIVO:    'Agresivo',
}

export const FREQUENCY_LEVEL_LABEL: Record<FrequencyLevel, string> = {
  SUAVE:    'Suave',
  MODERADA: 'Moderada',
  ALTA:     'Alta',
}
