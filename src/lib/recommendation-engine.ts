// src/lib/recommendation-engine.ts
import type { PixelAnalysis } from './pixel-analyzer'

export interface Recommendation {
  id: string
  type: 'scale_up' | 'scale_down' | 'activate' | 'pause' | 'create' | 'optimize' | 'level_up'
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  description: string
  action?: { label: string; href?: string }
  phase?: string
}

interface CampaignSummary {
  name: string
  status: string
  strategy_type?: string | null
  daily_budget?: number
  metrics?: { roas?: number; spend?: number } | null
}

export function generateRecommendations(
  pixelAnalysis: PixelAnalysis | null,
  campaigns: CampaignSummary[],
  _monthlyBudget?: { total_budget: number; phase_budgets: any; phase_results: any },
): Recommendation[] {
  const recs: Recommendation[] = []

  // No pixel → first thing to do
  if (!pixelAnalysis || pixelAnalysis.level === 0) {
    recs.push({
      id: 'install-pixel',
      type: 'create', priority: 'high', icon: '🔴',
      title: 'Instalá el Pixel de Meta',
      description: 'Sin pixel no podemos medir resultados ni crear audiencias inteligentes. Es el primer paso para crecer.',
      action: { label: 'Configurar pixel →', href: '/dashboard/settings' },
    })
    return recs
  }

  // Level-based growth recommendations
  if (pixelAnalysis.level <= 2) {
    recs.push({
      id: 'grow-traffic',
      type: 'scale_up', priority: 'high', icon: '📢',
      title: 'Aumentá el tráfico a tu sitio',
      description: `Tenés ${pixelAnalysis.events.PageView.count_30d} visitas en 30 días. Necesitás 500+ para desbloquear estrategias avanzadas. Invertí en campañas F1 de reconocimiento.`,
      action: { label: 'Crear campaña TOFU →', href: '/dashboard/create' },
      phase: 'F1',
    })
  }

  if (pixelAnalysis.level >= 3 && !pixelAnalysis.canRetargetAddToCart) {
    recs.push({
      id: 'activate-mofu',
      type: 'activate', priority: 'high', icon: '🎯',
      title: 'Activá campañas de remarketing',
      description: `Ya tenés ${pixelAnalysis.events.ViewContent.count_30d} vistas de producto. Podés hacer retargeting a visitantes que no compraron.`,
      action: { label: 'Crear campaña MOFU →', href: '/dashboard/create' },
      phase: 'F3',
    })
  }

  if (pixelAnalysis.canRetargetAddToCart && !pixelAnalysis.canRetargetPurchase) {
    recs.push({
      id: 'retarget-cart',
      type: 'activate', priority: 'high', icon: '🛒',
      title: 'Recuperá carritos abandonados',
      description: `Tenés ${pixelAnalysis.events.AddToCart.count_30d} carritos en 30 días. Creá una campaña de remarketing para recuperarlos.`,
      action: { label: 'Crear remarketing →', href: '/dashboard/create' },
      phase: 'F3',
    })
  }

  if (pixelAnalysis.canCreateLookalike) {
    recs.push({
      id: 'create-lookalike',
      type: 'scale_up', priority: 'medium', icon: '🚀',
      title: 'Escalá con Lookalike Audiences',
      description: `Con ${pixelAnalysis.events.Purchase.count_180d} compras, Meta puede encontrar personas similares a tus compradores. Es la forma más eficiente de escalar.`,
      action: { label: 'Crear campaña BOFU →', href: '/dashboard/create' },
      phase: 'F2',
    })
  }

  // Campaign performance recommendations
  const active = campaigns.filter(c => c.status === 'active')
  const highRoas = active.filter(c => (c.metrics?.roas ?? 0) >= 3)
  const lowRoas  = active.filter(c => {
    const r = c.metrics?.roas ?? 0
    return r > 0 && r < 1.5
  })

  for (const c of highRoas) {
    recs.push({
      id: `scale-${c.name}`,
      type: 'scale_up', priority: 'high', icon: '📈',
      title: `Escalá "${c.name}"`,
      description: `ROAS de ${c.metrics!.roas!.toFixed(1)}x — está dando resultados. Considerá aumentar el presupuesto un 20-30%.`,
    })
  }

  for (const c of lowRoas) {
    recs.push({
      id: `pause-${c.name}`,
      type: 'pause', priority: 'medium', icon: '⚠️',
      title: `Revisá "${c.name}"`,
      description: `ROAS de ${c.metrics!.roas!.toFixed(1)}x — por debajo del punto de equilibrio. Considerá pausar o cambiar creativos.`,
    })
  }

  // Next-level milestone
  const nextLevel = pixelAnalysis.level + 1
  if (nextLevel <= 8) {
    const LEVEL_REQS: Record<number, string> = {
      1: '100 visitas en 30 días',
      2: '500 visitas en 30 días',
      3: '1.000 vistas de producto en 30 días',
      4: '100 carritos en 30 días',
      5: '50 compras en 30 días',
      6: '100 compras en 30 días',
      7: '500 compras en 180 días',
      8: '1.000 compras en 180 días',
    }
    recs.push({
      id: 'level-up',
      type: 'level_up', priority: 'low', icon: '⬆️',
      title: `Siguiente nivel: ${nextLevel}`,
      description: `Necesitás ${LEVEL_REQS[nextLevel]} para subir de nivel y desbloquear nuevas estrategias.`,
    })
  }

  return recs
}
