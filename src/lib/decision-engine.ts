// src/lib/decision-engine.ts
// Centralized strategic decision engine for the AdFlow dashboard.
//
// Consumes a snapshot of the user's business state (pixel, campaigns, budget,
// onboarding, Meta connection, sync state) and returns a structured decision:
//
//   • primaryAction   — the single most important thing to do right now
//   • secondaryActions — up to 2 follow-up actions
//   • alerts           — background signals split into 'alert' vs 'opportunity'
//
// Philosophy: it's better to tell the user ONE thing they should do than give
// them 10 vague suggestions. Priorities are hierarchical:
//   critical  — blockers; nothing else matters until resolved
//   important — actionable this week
//   opportunity — nice-to-have, gains if acted upon

export type Priority = 'critical' | 'important' | 'opportunity'
export type Impact = 'high' | 'medium' | 'low'

export interface PrimaryAction {
  id: string
  title: string
  description: string
  reason: string
  priority: Priority
  impact: Impact
  cta: { label: string; href: string }
  icon: string
}

export interface SecondaryAction {
  id: string
  title: string
  description: string
  cta: { label: string; href: string }
  icon: string
}

export interface DecisionAlert {
  id: string
  type: 'alert' | 'opportunity'
  title: string
  description: string
  priority: Priority
  cta?: { label: string; href: string }
  icon: string
}

export interface StrategicDecision {
  primaryAction: PrimaryAction
  secondaryActions: SecondaryAction[]
  alerts: DecisionAlert[]
  /** ID of the primary action — used to persist / correlate with memory */
  decisionId: string
  /** Snapshot of the business state at generation time — stored with the decision */
  contextSnapshot: Record<string, unknown>
}

/** Memory feedback from past decisions — optional, engine works without it */
export interface DecisionMemoryInput {
  ignoredActions: string[]
  completedActions: string[]
  repeatedSuggestions: Record<string, number>
  lastSuggestedActionId: string | null
}

export interface DecisionInput {
  // Onboarding
  onboardingComplete: boolean
  onboardingNextStep?: { label: string; href: string }
  onboardingCompletedSteps: number
  onboardingTotalSteps: number

  // Pixel
  pixelConfigured: boolean
  pixelLevel: number
  pixelLevelName: string
  pageViews30d: number
  viewContent30d: number
  addToCart30d: number
  purchases30d: number
  purchases180d: number
  canRetargetVC: boolean
  canRetargetATC: boolean
  canRetargetPurchase: boolean
  canCreateLookalike: boolean

  // Campaigns
  totalCampaigns: number
  activeCampaigns: number
  totalSpendMonth: number
  totalRevenueMonth: number
  avgRoas: number
  avgCpa: number
  bestRoasCampaign?: { name: string; roas: number; id: string }
  worstRoasCampaign?: { name: string; roas: number; id: string }

  // Budget
  hasBudget: boolean
  budgetTotal: number
  budgetSpent: number

  // Meta connection
  metaConnected: boolean
  tokenExpiresAt?: string

  // Last sync
  lastSyncAt?: string

  // Memory (optional — when absent, engine runs stateless like before)
  memory?: DecisionMemoryInput
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  important: 1,
  opportunity: 2,
}

export function generateStrategicDecisions(input: DecisionInput): StrategicDecision {
  const actions: PrimaryAction[] = []
  const alerts: DecisionAlert[] = []

  // ═══════════════════════════════════════════════════════════
  // CRITICAL — blockers. Nothing else matters until solved.
  // ═══════════════════════════════════════════════════════════

  // R1: Onboarding incomplete
  if (!input.onboardingComplete) {
    const step = input.onboardingNextStep
    actions.push({
      id: 'complete_setup',
      title: step?.label || 'Completá la configuración de tu cuenta',
      description: `Llevás ${input.onboardingCompletedSteps} de ${input.onboardingTotalSteps} pasos completados. Terminá el setup para poder crear campañas y medir resultados.`,
      reason: 'Sin la configuración completa, el sistema no puede analizar tu negocio ni crear campañas.',
      priority: 'critical',
      impact: 'high',
      cta: { label: 'Completar setup →', href: step?.href || '/dashboard/onboarding' },
      icon: '🔧',
    })
  }

  // R2: Meta not connected
  if (!input.metaConnected) {
    actions.push({
      id: 'connect_meta',
      title: 'Conectá tu cuenta de Meta',
      description: 'Sin conexión a Facebook/Instagram no podemos crear campañas ni medir resultados.',
      reason: 'La conexión con Meta es el primer paso para operar.',
      priority: 'critical',
      impact: 'high',
      cta: { label: 'Conectar Meta →', href: '/dashboard/settings' },
      icon: '🔗',
    })
  }

  // R3: Pixel not configured
  if (input.metaConnected && !input.pixelConfigured) {
    actions.push({
      id: 'configure_pixel',
      title: 'Configurá tu pixel de Meta',
      description: 'El pixel mide todo lo que pasa en tu sitio. Sin él, no podemos analizar tu negocio ni crear audiencias.',
      reason: 'El pixel es la fuente de datos de todo el sistema.',
      priority: 'critical',
      impact: 'high',
      cta: { label: 'Configurar pixel →', href: '/dashboard/settings' },
      icon: '📡',
    })
  }

  // R4: Token expiring / expired
  if (input.tokenExpiresAt) {
    const daysToExpiry = Math.floor(
      (new Date(input.tokenExpiresAt).getTime() - Date.now()) / 86400000
    )
    if (daysToExpiry <= 0) {
      actions.push({
        id: 'token_expired',
        title: 'Tu conexión con Meta expiró',
        description: 'Reconectá tu cuenta para seguir sincronizando métricas y operando campañas.',
        reason: 'Sin token activo, el sistema no puede comunicarse con Meta.',
        priority: 'critical',
        impact: 'high',
        cta: { label: 'Reconectar ahora →', href: '/dashboard/settings' },
        icon: '🔴',
      })
    } else if (daysToExpiry <= 7) {
      alerts.push({
        id: 'token_expiring',
        type: 'alert',
        title: `Tu conexión con Meta expira en ${daysToExpiry} día${daysToExpiry === 1 ? '' : 's'}`,
        description: 'Reconectá tu cuenta para no perder la sincronización de métricas.',
        priority: 'critical',
        cta: { label: 'Reconectar →', href: '/dashboard/settings' },
        icon: '⚠️',
      })
    }
  }

  // R13: Spending money but no conversions — critical alert
  if (input.totalSpendMonth > 0 && input.purchases30d === 0 && input.totalCampaigns > 0) {
    alerts.push({
      id: 'spend_no_conv',
      type: 'alert',
      title: 'Estás invirtiendo pero sin conversiones',
      description: `Gastaste $${input.totalSpendMonth.toFixed(0)} este mes sin generar compras. Revisá tus audiencias, creativos y landing page.`,
      priority: 'critical',
      icon: '🔴',
    })
  }

  // ═══════════════════════════════════════════════════════════
  // IMPORTANT — actionable this week
  // ═══════════════════════════════════════════════════════════

  // R5: No monthly budget
  if (input.onboardingComplete && !input.hasBudget) {
    actions.push({
      id: 'set_budget',
      title: 'Definí tu presupuesto mensual',
      description: 'Configurá cuánto vas a invertir este mes para que el sistema distribuya tu presupuesto entre las fases de crecimiento.',
      reason: 'Sin presupuesto definido, no podemos recomendar distribución ni medir eficiencia.',
      priority: 'important',
      impact: 'high',
      cta: { label: 'Planificar presupuesto →', href: '/dashboard/budget' },
      icon: '💰',
    })
  }

  // R6: Level 0-1 without campaigns — needs traffic
  if (input.pixelConfigured && input.pixelLevel <= 1 && input.totalCampaigns === 0) {
    actions.push({
      id: 'first_campaign',
      title: 'Creá tu primera campaña para generar tráfico',
      description: `Tu pixel tiene ${input.pageViews30d} visitas en 30 días. Necesitás al menos 100 para empezar a analizar tu negocio. Una campaña TOFU va a generar ese tráfico.`,
      reason: 'Sin tráfico, el pixel no aprende y no podemos crear audiencias inteligentes.',
      priority: 'important',
      impact: 'high',
      cta: { label: 'Crear campaña TOFU →', href: '/dashboard/create' },
      icon: '🚀',
    })
  }

  // R7: Has campaigns but never synced
  if (input.totalCampaigns > 0 && !input.lastSyncAt) {
    actions.push({
      id: 'first_sync',
      title: 'Sincronizá las métricas de tus campañas',
      description: 'Tenés campañas creadas pero sin datos de rendimiento. Sincronizá para ver cómo están funcionando.',
      reason: 'Sin datos reales, las recomendaciones no pueden ser precisas.',
      priority: 'important',
      impact: 'medium',
      cta: { label: 'Sincronizar ahora →', href: '/dashboard' },
      icon: '🔄',
    })
  }

  // R8: Level 2 — has traffic, needs more ViewContent
  if (input.pixelLevel === 2 && input.viewContent30d < 1000) {
    const remaining = Math.max(0, 1000 - input.viewContent30d)
    actions.push({
      id: 'grow_vc',
      title: `Te faltan ${remaining.toLocaleString()} vistas de producto para desbloquear remarketing`,
      description: 'Cuando llegues a 1000 ViewContent en 30 días, vas a poder crear campañas de remarketing que recuperen visitantes.',
      reason: 'El remarketing es donde se genera el mayor retorno de inversión.',
      priority: 'important',
      impact: 'high',
      cta: { label: 'Crear campaña de tráfico →', href: '/dashboard/create' },
      icon: '📈',
    })
  }

  // R10: High AddToCart, low Purchase — conversion problem
  if (input.addToCart30d > 50 && input.purchases30d < 10) {
    actions.push({
      id: 'fix_conversion',
      title: 'Tus visitantes agregan al carrito pero no compran',
      description: `Tenés ${input.addToCart30d} carritos pero solo ${input.purchases30d} compras. El problema puede estar en el checkout, los costos de envío o los métodos de pago.`,
      reason: 'Un embudo con mucho abandono de carrito indica fricción en la etapa final.',
      priority: 'important',
      impact: 'high',
      cta: { label: 'Crear remarketing de carritos →', href: '/dashboard/create' },
      icon: '🛒',
    })
  }

  // R9: Pixel supports retargeting — MOFU opportunity
  if (input.canRetargetVC && input.pixelLevel >= 3 && input.activeCampaigns > 0) {
    alerts.push({
      id: 'activate_mofu',
      type: 'opportunity',
      title: 'Tu pixel ya soporta remarketing',
      description: `Tenés ${input.viewContent30d.toLocaleString()} vistas de producto. Creá una campaña MOFU para recuperar visitantes que no compraron.`,
      priority: 'important',
      cta: { label: 'Crear remarketing →', href: '/dashboard/create' },
      icon: '🎯',
    })
  }

  // R12: Worst campaign ROAS < 1 — review alert
  if (input.worstRoasCampaign && input.worstRoasCampaign.roas > 0 && input.worstRoasCampaign.roas < 1) {
    alerts.push({
      id: 'review_worst',
      type: 'alert',
      title: `"${input.worstRoasCampaign.name}" tiene ROAS ${input.worstRoasCampaign.roas.toFixed(1)}x`,
      description: 'Esta campaña está perdiendo dinero. Considerá pausarla o cambiar los creativos.',
      priority: 'important',
      cta: { label: 'Ver campaña →', href: `/dashboard/campaigns/${input.worstRoasCampaign.id}` },
      icon: '⚠️',
    })
  }

  // R15: Budget spent >90%
  if (input.hasBudget && input.budgetTotal > 0) {
    const pctSpent = (input.budgetSpent / input.budgetTotal) * 100
    if (pctSpent > 90) {
      alerts.push({
        id: 'budget_almost_done',
        type: 'alert',
        title: `Tu presupuesto del mes está al ${pctSpent.toFixed(0)}%`,
        description: 'Considerá ajustar la distribución o definir el presupuesto del próximo mes.',
        priority: 'important',
        cta: { label: 'Ver presupuesto →', href: '/dashboard/budget' },
        icon: '💰',
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OPPORTUNITY — scale what already works
  // ═══════════════════════════════════════════════════════════

  // R11: Best campaign has excellent ROAS — scale it
  if (input.bestRoasCampaign && input.bestRoasCampaign.roas >= 3) {
    alerts.push({
      id: 'scale_best',
      type: 'opportunity',
      title: `"${input.bestRoasCampaign.name}" tiene ROAS ${input.bestRoasCampaign.roas.toFixed(1)}x`,
      description: 'Esta campaña está dando muy buenos resultados. Considerá escalar el presupuesto un 15-20%.',
      priority: 'opportunity',
      cta: { label: 'Ver campaña →', href: `/dashboard/campaigns/${input.bestRoasCampaign.id}` },
      icon: '📈',
    })
  }

  // R14: Can create lookalike
  if (input.canCreateLookalike && input.pixelLevel >= 6) {
    alerts.push({
      id: 'create_lookalike',
      type: 'opportunity',
      title: 'Podés crear Lookalike Audiences',
      description: `Con ${input.purchases180d.toLocaleString()} compras, Meta puede encontrar personas similares a tus mejores clientes. Suele ser la forma más eficiente de escalar.`,
      priority: 'opportunity',
      cta: { label: 'Crear campaña BOFU →', href: '/dashboard/create' },
      icon: '🔮',
    })
  }

  // ═══════════════════════════════════════════════════════════
  // MEMORY — adjust decisions based on past behaviour
  // ═══════════════════════════════════════════════════════════

  let effectiveActions = actions
  if (input.memory) {
    const mem = input.memory

    for (const action of effectiveActions) {
      // If the user already completed this action, demote it to an opportunity
      // and annotate the description so it doesn't feel like a repeated ask.
      if (mem.completedActions.includes(action.id)) {
        action.priority = 'opportunity'
        if (!action.description.endsWith('(Ya realizaste esta acción recientemente)')) {
          action.description += ' (Ya realizaste esta acción recientemente)'
        }
      }

      // If the same action has been suggested 3+ times without being executed,
      // reframe the reason to acknowledge the repetition.
      const repeatCount = mem.repeatedSuggestions[action.id] || 0
      if (repeatCount >= 3) {
        action.reason = `Te lo recomendamos ${repeatCount} veces. Es realmente importante para tu crecimiento.`
      }

      // If this was the last thing we suggested and the user ignored it, emphasize.
      if (action.id === mem.lastSuggestedActionId && mem.ignoredActions.includes(action.id)) {
        if (!action.title.startsWith('📌 ')) {
          action.title = `📌 ${action.title}`
        }
      }
    }

    // Completed non-critical actions are filtered out of the top slot
    effectiveActions = effectiveActions.filter(a =>
      !mem.completedActions.includes(a.id) || a.priority === 'critical'
    )
  }

  // ═══════════════════════════════════════════════════════════
  // FINALIZE — sort by priority and build result
  // ═══════════════════════════════════════════════════════════

  effectiveActions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  alerts.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  // Default "all good" state
  if (effectiveActions.length === 0) {
    effectiveActions.push({
      id: 'all_good',
      title: 'Todo en orden. Seguí monitoreando tus campañas.',
      description: 'No hay acciones urgentes por ahora. Revisá el dashboard periódicamente para detectar oportunidades.',
      reason: 'Tu negocio está funcionando correctamente.',
      priority: 'opportunity',
      impact: 'low',
      cta: { label: 'Ver reportes →', href: '/dashboard/reports' },
      icon: '✅',
    })
  }

  const primary = effectiveActions[0]

  const contextSnapshot: Record<string, unknown> = {
    pixelLevel:      input.pixelLevel,
    pageViews30d:    input.pageViews30d,
    viewContent30d:  input.viewContent30d,
    addToCart30d:    input.addToCart30d,
    purchases30d:    input.purchases30d,
    purchases180d:   input.purchases180d,
    totalSpendMonth: input.totalSpendMonth,
    totalRevenueMonth: input.totalRevenueMonth,
    avgRoas:         input.avgRoas,
    totalCampaigns:  input.totalCampaigns,
    activeCampaigns: input.activeCampaigns,
    hasBudget:       input.hasBudget,
    metaConnected:   input.metaConnected,
    pixelConfigured: input.pixelConfigured,
    onboardingComplete: input.onboardingComplete,
  }

  return {
    primaryAction: primary,
    secondaryActions: effectiveActions.slice(1, 3).map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      cta: a.cta,
      icon: a.icon,
    })),
    alerts,
    decisionId: primary.id,
    contextSnapshot,
  }
}
