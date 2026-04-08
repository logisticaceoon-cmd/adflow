// src/lib/diagnostic-rules.ts
// The 17 expert rules from the V1_0 workbook, converted into executable code.
// Each rule receives a CampaignMetrics snapshot + current settings and tells
// whether it applies. The engine picks the first matching rule by priority.
//
// Ordering note: rules are defined in priority order in the `DIAGNOSTIC_RULES`
// array but `evaluateDiagnosticRules` re-sorts defensively so the array can be
// reordered without breaking the engine.
import type { StrategySettings } from './strategy-settings'
import { DEFAULT_SETTINGS } from './strategy-settings'

export type DiagnosticType = 'Escalar' | 'Optimizar' | 'Pausar' | 'Observar'

export interface CampaignMetrics {
  spend: number
  purchases: number
  revenue: number
  roas: number
  cpa: number
  addToCart: number
  initiateCheckout: number
  ctr: number
  frequency: number
  cpm: number
  viewContent: number
  impressions: number
  clicks: number
  reach: number
}

export const EMPTY_METRICS: CampaignMetrics = {
  spend: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0,
  addToCart: 0, initiateCheckout: 0, ctr: 0, frequency: 0,
  cpm: 0, viewContent: 0, impressions: 0, clicks: 0, reach: 0,
}

export interface DiagnosticRule {
  id: string
  priority: number
  type: DiagnosticType
  templateId: string
  /** Short label shown in debug/log outputs */
  label: string
  /** True if this rule applies to the metrics snapshot */
  evaluate: (m: CampaignMetrics, s: StrategySettings) => boolean
}

// ═══════════════════════════════════════════════════════════════
// 17 RULES (R01-R17) — priority DESC
// ═══════════════════════════════════════════════════════════════

export const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  // ── Escalar / pausa críticas ──
  {
    id: 'R01', priority: 100, type: 'Escalar', templateId: 'T02',
    label: 'ROAS ≥ 7 y compras ≥ 10',
    evaluate: (m) => m.roas >= 7 && m.purchases >= 10,
  },
  {
    id: 'R03', priority: 95, type: 'Pausar', templateId: 'T03',
    label: 'ROAS < 3 y gasto > 50k',
    evaluate: (m) => m.roas < 3 && m.spend > 50000,
  },
  {
    id: 'R16', priority: 95, type: 'Pausar', templateId: 'T16',
    label: 'CTR < 0.5% y gasto > 30k',
    evaluate: (m) => m.ctr < 0.5 && m.spend > 30000,
  },
  {
    id: 'R13', priority: 90, type: 'Pausar', templateId: 'T13',
    label: 'Gasto > 100k con < 5 compras',
    evaluate: (m) => m.spend > 100000 && m.purchases < 5,
  },

  // ── Optimizar (alta prioridad) ──
  {
    id: 'R02', priority: 90, type: 'Optimizar', templateId: 'T14',
    label: 'CPA bajo y compras < carritos',
    evaluate: (m) => m.cpa > 0 && m.cpa <= 5 && m.purchases < m.addToCart,
  },
  {
    id: 'R07', priority: 88, type: 'Optimizar', templateId: 'T07',
    label: 'Carritos ≥ 50 pero checkout < carritos',
    evaluate: (m) => m.addToCart >= 50 && m.initiateCheckout < m.addToCart,
  },
  {
    id: 'R08', priority: 87, type: 'Optimizar', templateId: 'T08',
    label: 'Checkouts ≥ 30 pero compras < checkouts',
    evaluate: (m) => m.initiateCheckout >= 30 && m.purchases < m.initiateCheckout,
  },
  {
    id: 'R06', priority: 85, type: 'Optimizar', templateId: 'T06',
    label: 'CTR ≥ 1.5% pero carritos < 10',
    evaluate: (m) => m.ctr >= 1.5 && m.addToCart < 10,
  },
  {
    id: 'R05', priority: 80, type: 'Optimizar', templateId: 'T21',
    label: 'ROAS ≥ 6 con frecuencia > 3',
    evaluate: (m) => m.roas >= 6 && m.frequency > 3,
  },
  {
    id: 'R11', priority: 75, type: 'Optimizar', templateId: 'T11',
    label: 'Frecuencia ≥ 4 con ROAS < 6',
    evaluate: (m) => m.frequency >= 4 && m.roas < 6,
  },
  {
    id: 'R09', priority: 70, type: 'Optimizar', templateId: 'T09',
    label: 'CPA > ticket promedio con ROAS ≥ 4',
    evaluate: (m, s) => m.cpa > s.ticket_promedio && m.roas >= 4,
  },
  {
    id: 'R12', priority: 65, type: 'Optimizar', templateId: 'T12',
    label: 'ROAS 3-6 (rendimiento intermedio)',
    evaluate: (m) => m.roas >= 3 && m.roas < 6,
  },
  {
    id: 'R10', priority: 60, type: 'Optimizar', templateId: 'T10',
    label: 'CPM > 5k con CTR < 1%',
    evaluate: (m) => m.cpm > 5000 && m.ctr < 1,
  },
  {
    id: 'R15', priority: 55, type: 'Optimizar', templateId: 'T15',
    label: 'CPM < 5k con ROAS < 3',
    evaluate: (m) => m.cpm < 5000 && m.roas < 3,
  },

  // ── Observar (menor prioridad) ──
  {
    id: 'R17', priority: 50, type: 'Observar', templateId: 'T17',
    label: 'ROAS ≥ 6 pero con < 10 compras',
    evaluate: (m) => m.roas >= 6 && m.purchases < 10,
  },
  {
    id: 'R14', priority: 40, type: 'Observar', templateId: 'T14B',
    label: 'ROAS ≥ 5 con frecuencia < 2',
    evaluate: (m) => m.roas >= 5 && m.frequency < 2,
  },
  {
    id: 'R04', priority: 10, type: 'Observar', templateId: 'T01',
    label: 'Sin compras y gasto < 30k',
    evaluate: (m) => m.purchases <= 0 && m.spend < 30000,
  },
]

// ═══════════════════════════════════════════════════════════════
// EVALUATOR — returns the first matching rule by priority
// ═══════════════════════════════════════════════════════════════

export interface DiagnosticMatch {
  rule: DiagnosticRule | null
  matched: boolean
  /** All rules that matched (for debugging / transparency) */
  allMatches: DiagnosticRule[]
}

export function evaluateDiagnosticRules(
  metrics: CampaignMetrics,
  settings: StrategySettings = DEFAULT_SETTINGS,
): DiagnosticMatch {
  const sorted = [...DIAGNOSTIC_RULES].sort((a, b) => b.priority - a.priority)
  const allMatches = sorted.filter(r => {
    try { return r.evaluate(metrics, settings) } catch { return false }
  })
  if (allMatches.length === 0) {
    return { rule: null, matched: false, allMatches: [] }
  }
  return { rule: allMatches[0], matched: true, allMatches }
}
