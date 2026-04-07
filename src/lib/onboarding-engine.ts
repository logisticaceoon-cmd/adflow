// src/lib/onboarding-engine.ts
// Pure function that computes the onboarding progress based on user setup state.
// Used by the dashboard widget, the /dashboard/onboarding page, the sidebar mini-widget,
// and the /api/onboarding/status endpoint.

export interface OnboardingStepInfo {
  done: boolean
  label: string
  description: string
  href: string
  why: string
}

export type OnboardingStepKey =
  | 'meta_connected'
  | 'ad_account_selected'
  | 'pixel_configured'
  | 'level_detected'
  | 'budget_set'
  | 'first_campaign'

export interface OnboardingStatus {
  isComplete: boolean
  completionScore: number // 0-100
  steps: Record<OnboardingStepKey, OnboardingStepInfo>
  stepOrder: OnboardingStepKey[]
  nextStep: OnboardingStepKey | null
  totalSteps: number
  completedSteps: number
}

export interface OnboardingInput {
  hasFbConnection: boolean
  hasAdAccount: boolean
  hasPixel: boolean
  pixelLevel: number | null
  hasBudget: boolean
  campaignCount: number
}

export function calculateOnboardingStatus(data: OnboardingInput): OnboardingStatus {
  const steps: Record<OnboardingStepKey, OnboardingStepInfo> = {
    meta_connected: {
      done: data.hasFbConnection,
      label: 'Conectar cuenta de Meta',
      description: 'Vinculá tu cuenta de Facebook/Instagram para publicar anuncios',
      href: '/dashboard/settings',
      why: 'Es la base de todo: sin cuenta conectada, AdFlow no puede crear ni publicar campañas en Meta Ads. Conectarla lleva 30 segundos y podés desconectarla cuando quieras.',
    },
    ad_account_selected: {
      done: data.hasAdAccount,
      label: 'Seleccionar cuenta publicitaria',
      description: 'Elegí la cuenta donde se van a crear tus campañas',
      href: '/dashboard/settings',
      why: 'Si manejás varias cuentas publicitarias, necesitamos saber en cuál publicar. Vamos a usar esta para todas las campañas que crees.',
    },
    pixel_configured: {
      done: data.hasPixel,
      label: 'Configurar pixel de Meta',
      description: 'El pixel mide todo lo que pasa en tu sitio web',
      href: '/dashboard/settings',
      why: 'El pixel es un pequeño código que se instala en tu tienda online. Mide quién visita, quién ve productos, quién agrega al carrito y quién compra. Sin pixel, no podemos medir resultados ni crear audiencias inteligentes.',
    },
    level_detected: {
      done: data.pixelLevel !== null && data.pixelLevel >= 0 && data.hasPixel,
      label: 'Analizar tu nivel',
      description: 'Escaneamos tu pixel para saber en qué punto está tu negocio',
      href: '/dashboard/pixel',
      why: 'Miramos los datos que ya tiene tu pixel para darte un nivel (0 a 8). Ese nivel nos dice qué estrategias podés usar hoy (TOFU, MOFU, BOFU) y qué audiencias avanzadas están disponibles.',
    },
    budget_set: {
      done: data.hasBudget,
      label: 'Definir presupuesto mensual',
      description: 'Configurá cuánto vas a invertir y cómo se distribuye',
      href: '/dashboard/budget',
      why: 'Con tu presupuesto mensual AdFlow te recomienda cómo dividirlo entre las fases del embudo (F1 tráfico, F2 ventas, F3 remarketing, F4 WhatsApp). Así invertís con criterio, no a ciegas.',
    },
    first_campaign: {
      done: data.campaignCount > 0,
      label: 'Crear primera campaña',
      description: 'Lanzá tu primera campaña con IA y empezá a vender',
      href: '/dashboard/create',
      why: 'Ya tenés todo listo. Describí tu producto y en 20 segundos la IA genera copies, audiencias, presupuesto recomendado y una estrategia completa. Revisás, aprobás y publicás directo en Meta.',
    },
  }

  const stepOrder: OnboardingStepKey[] = [
    'meta_connected',
    'ad_account_selected',
    'pixel_configured',
    'level_detected',
    'budget_set',
    'first_campaign',
  ]

  const completedSteps = stepOrder.filter(k => steps[k].done).length
  const totalSteps = stepOrder.length
  const completionScore = Math.round((completedSteps / totalSteps) * 100)
  const nextStep = stepOrder.find(k => !steps[k].done) || null
  const isComplete = completedSteps === totalSteps

  return { isComplete, completionScore, steps, stepOrder, nextStep, totalSteps, completedSteps }
}
