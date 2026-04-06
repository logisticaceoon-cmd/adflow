// src/lib/growth-engine.ts
// Computes the user's growth status: progress to next level, phase, momentum.

export interface GrowthStatus {
  currentLevel: number
  currentLevelName: string
  nextLevel: number
  nextLevelName: string
  progressToNextLevel: number // 0-100
  currentPhase: 'Aprendizaje' | 'Crecimiento' | 'Escala' | 'Expansión'
  monthlyGrowthRate: number   // % change month-over-month in purchases
  strategy: string
  nextMilestone: string
  estimatedTimeToNextLevel: string
}

const LEVEL_NAMES = [
  'Sin Data', 'Explorador', 'Aprendiz', 'Estratega', 'Vendedor',
  'Profesional', 'Escalador', 'Maestro', 'Imperio',
]

export function calculateGrowthStatus(
  pixelEvents: any,
  previousMonthPurchases: number,
  level: number,
  levelName: string,
): GrowthStatus {
  const currentPurchases30d  = pixelEvents?.Purchase?.count_30d  || 0
  const currentPurchases180d = pixelEvents?.Purchase?.count_180d || 0

  // Threshold + current value for the bar that takes the user to NEXT level
  const LEVEL_THRESHOLDS: Record<number, { metric: string; threshold: number; current: number }> = {
    0: { metric: 'PageView 30d',    threshold: 100,  current: pixelEvents?.PageView?.count_30d    || 0 },
    1: { metric: 'PageView 30d',    threshold: 500,  current: pixelEvents?.PageView?.count_30d    || 0 },
    2: { metric: 'ViewContent 30d', threshold: 1000, current: pixelEvents?.ViewContent?.count_30d || 0 },
    3: { metric: 'AddToCart 30d',   threshold: 100,  current: pixelEvents?.AddToCart?.count_30d   || 0 },
    4: { metric: 'Purchase 30d',    threshold: 50,   current: currentPurchases30d },
    5: { metric: 'Purchase 30d',    threshold: 100,  current: currentPurchases30d },
    6: { metric: 'Purchase 180d',   threshold: 500,  current: currentPurchases180d },
    7: { metric: 'Purchase 180d',   threshold: 1000, current: currentPurchases180d },
    8: { metric: 'Expansión',       threshold: 1,    current: 1 },
  }

  const next = LEVEL_THRESHOLDS[level] || { metric: '', threshold: 1, current: 1 }
  const progress = Math.min(100, Math.round((next.current / next.threshold) * 100))

  const growthRate = previousMonthPurchases > 0
    ? Math.round(((currentPurchases30d - previousMonthPurchases) / previousMonthPurchases) * 100)
    : 0

  const phase: GrowthStatus['currentPhase'] =
    level <= 2 ? 'Aprendizaje' :
    level <= 4 ? 'Crecimiento' :
    level <= 6 ? 'Escala'      : 'Expansión'

  const strategies: Record<GrowthStatus['currentPhase'], string> = {
    'Aprendizaje': 'Enfocate en generar tráfico y alimentar el pixel. Campañas TOFU con audiencias amplias e intereses.',
    'Crecimiento': 'Activá remarketing y empezá a convertir visitantes. Campañas MOFU + TOFU para mantener el funnel.',
    'Escala':      'Escalá con lookalikes y retargeting agresivo. BOFU + MOFU son tu motor de ventas.',
    'Expansión':   'Expandí a nuevos mercados y audiencias. Diversificá canales y aumentá presupuesto.',
  }

  const remaining = Math.max(0, next.threshold - next.current)
  const dailyRate = next.current / 30
  const daysToNext = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : 999
  const timeEstimate = level >= 8
    ? 'Nivel máximo alcanzado'
    : daysToNext <= 7  ? `~${daysToNext} días`
    : daysToNext <= 60 ? `~${Math.ceil(daysToNext / 7)} semanas`
    :                    `~${Math.ceil(daysToNext / 30)} meses`

  return {
    currentLevel: level,
    currentLevelName: levelName,
    nextLevel: Math.min(level + 1, 8),
    nextLevelName: LEVEL_NAMES[Math.min(level + 1, 8)],
    progressToNextLevel: progress,
    currentPhase: phase,
    monthlyGrowthRate: growthRate,
    strategy: strategies[phase],
    nextMilestone: `${next.threshold} ${next.metric}`,
    estimatedTimeToNextLevel: timeEstimate,
  }
}
