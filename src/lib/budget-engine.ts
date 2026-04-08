// src/lib/budget-engine.ts
// Recommends a phased monthly budget split based on the user's pixel level.

export type Phase = 'F1' | 'F2' | 'F3' | 'F4'

export interface PhaseConfig {
  key: Phase
  name: string
  fullName: string
  objective: string
  icon: string
  color: string
}

export const PHASES: PhaseConfig[] = [
  { key: 'F1', name: 'Reconocimiento', fullName: 'F1 — Reconocimiento', objective: 'Branding + tráfico frío',         icon: '📢', color: '#62c4b0' },
  { key: 'F2', name: 'Ventas',         fullName: 'F2 — Ventas',         objective: 'Conversiones público frío/tibio', icon: '💰', color: 'var(--ds-color-primary)' },
  { key: 'F3', name: 'Remarketing',    fullName: 'F3 — Remarketing',    objective: 'Retargeting visitantes/carritos', icon: '🎯', color: '#f59e0b' },
  { key: 'F4', name: 'WhatsApp',       fullName: 'F4 — WhatsApp',       objective: 'Mensajes directos',               icon: '💬', color: '#25D366' },
]

export interface PhaseAllocation { recommended: number; percentage: number; reason: string }

export interface BudgetRecommendation {
  totalBudget: number
  currency: string
  phases: Record<Phase, PhaseAllocation>
  projections: {
    estimatedReach: string
    estimatedClicks: string
    estimatedConversions: string
    estimatedRoas: string
  }
}

export function recommendBudgetDistribution(
  totalBudget: number,
  currency: string,
  pixelLevel: number,
  _avgTicket?: number,
  targetRoas?: number,
): BudgetRecommendation {
  let phases: Record<Phase, PhaseAllocation>

  if (pixelLevel <= 2) {
    phases = {
      F1: { recommended: Math.round(totalBudget * 0.60), percentage: 60, reason: 'Prioridad máxima: generar tráfico para alimentar el pixel' },
      F2: { recommended: Math.round(totalBudget * 0.30), percentage: 30, reason: 'Testear conversiones con público frío' },
      F3: { recommended: 0,                              percentage: 0,  reason: 'No disponible: pixel sin datos suficientes para retargeting' },
      F4: { recommended: Math.round(totalBudget * 0.10), percentage: 10, reason: 'Canal directo para leads inmediatos' },
    }
  } else if (pixelLevel <= 4) {
    phases = {
      F1: { recommended: Math.round(totalBudget * 0.35), percentage: 35, reason: 'Mantener flujo de tráfico nuevo' },
      F2: { recommended: Math.round(totalBudget * 0.30), percentage: 30, reason: 'Escalar conversiones' },
      F3: { recommended: Math.round(totalBudget * 0.25), percentage: 25, reason: 'Retargeting de visitantes y carritos' },
      F4: { recommended: Math.round(totalBudget * 0.10), percentage: 10, reason: 'Mensajes a leads calificados' },
    }
  } else if (pixelLevel <= 6) {
    phases = {
      F1: { recommended: Math.round(totalBudget * 0.20), percentage: 20, reason: 'Mantener awareness para alimentar funnel' },
      F2: { recommended: Math.round(totalBudget * 0.30), percentage: 30, reason: 'Escalar ventas con lookalikes' },
      F3: { recommended: Math.round(totalBudget * 0.40), percentage: 40, reason: 'Retargeting agresivo: mayor ROAS' },
      F4: { recommended: Math.round(totalBudget * 0.10), percentage: 10, reason: 'WhatsApp para cierre de ventas' },
    }
  } else {
    phases = {
      F1: { recommended: Math.round(totalBudget * 0.15), percentage: 15, reason: 'Awareness sostenido' },
      F2: { recommended: Math.round(totalBudget * 0.35), percentage: 35, reason: 'Escalar con lookalikes ampliados' },
      F3: { recommended: Math.round(totalBudget * 0.40), percentage: 40, reason: 'Remarketing máximo rendimiento' },
      F4: { recommended: Math.round(totalBudget * 0.10), percentage: 10, reason: 'WhatsApp automatizado' },
    }
  }

  // Naive projection model — keeps the user grounded without overpromising
  const estimatedCPM = pixelLevel <= 2 ? 8 : pixelLevel <= 4 ? 6 : 4
  const estimatedCTR = pixelLevel <= 2 ? 1.5 : pixelLevel <= 4 ? 2.5 : 3.5
  const estimatedCR  = pixelLevel <= 2 ? 0.5 : pixelLevel <= 4 ? 1.5 : 3.0

  const reach       = Math.round((totalBudget / estimatedCPM) * 1000)
  const clicks      = Math.round(reach * (estimatedCTR / 100))
  const conversions = Math.round(clicks * (estimatedCR / 100))

  return {
    totalBudget, currency, phases,
    projections: {
      estimatedReach:       `${reach.toLocaleString()} personas/mes`,
      estimatedClicks:      `${clicks.toLocaleString()} clicks/mes`,
      estimatedConversions: `${conversions.toLocaleString()} conversiones/mes`,
      estimatedRoas:        targetRoas
        ? `${targetRoas}x objetivo`
        : pixelLevel <= 2 ? 'N/A (fase de aprendizaje)' : `${(pixelLevel * 0.8).toFixed(1)}x estimado`,
    },
  }
}
