// src/lib/pixel-analyzer.ts
// Reads pixel event stats from Meta and assigns the user a "level"
// that gates which audience strategies are available to them.
import { createAdminClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.facebook.com/v20.0'

export interface PixelEvents {
  PageView:         { count_7d: number; count_30d: number; count_180d: number }
  ViewContent:      { count_7d: number; count_30d: number; count_180d: number }
  AddToCart:        { count_7d: number; count_30d: number; count_180d: number }
  InitiateCheckout: { count_7d: number; count_30d: number; count_180d: number }
  Purchase:         { count_7d: number; count_30d: number; count_180d: number; value_30d: number }
}

export interface PixelAnalysis {
  pixelId: string
  events: PixelEvents
  level: number
  levelName: string
  canRetargetViewContent: boolean
  canRetargetAddToCart: boolean
  canRetargetPurchase: boolean
  canCreateLookalike: boolean
  availableStrategies: string[]
  availableAudienceTypes: string[]
  recommendations: string[]
}

interface LevelDef {
  level: number
  name: string
  check: (e: PixelEvents) => boolean
  strategies: string[]
  audienceTypes: string[]
}

const LEVELS: LevelDef[] = [
  { level: 0, name: 'Sin Data',     check: () => true,                              strategies: ['TOFU'],                 audienceTypes: ['broad'] },
  { level: 1, name: 'Explorador',   check: e => e.PageView.count_30d >= 100,        strategies: ['TOFU'],                 audienceTypes: ['broad', 'interest'] },
  { level: 2, name: 'Aprendiz',     check: e => e.PageView.count_30d >= 500,        strategies: ['TOFU'],                 audienceTypes: ['broad', 'interest'] },
  { level: 3, name: 'Estratega',    check: e => e.ViewContent.count_30d >= 1000,    strategies: ['TOFU', 'MOFU'],         audienceTypes: ['broad', 'interest', 'retargeting_vc'] },
  { level: 4, name: 'Vendedor',     check: e => e.AddToCart.count_30d >= 100,       strategies: ['TOFU', 'MOFU'],         audienceTypes: ['broad', 'interest', 'retargeting_vc', 'retargeting_atc'] },
  { level: 5, name: 'Profesional',  check: e => e.Purchase.count_30d >= 50,         strategies: ['TOFU', 'MOFU', 'BOFU'], audienceTypes: ['broad', 'interest', 'retargeting_vc', 'retargeting_atc', 'retargeting_purchase'] },
  { level: 6, name: 'Escalador',    check: e => e.Purchase.count_30d >= 100,        strategies: ['TOFU', 'MOFU', 'BOFU'], audienceTypes: ['broad', 'interest', 'retargeting_vc', 'retargeting_atc', 'retargeting_purchase', 'lookalike'] },
  { level: 7, name: 'Maestro',      check: e => e.Purchase.count_180d >= 500,       strategies: ['TOFU', 'MOFU', 'BOFU'], audienceTypes: ['broad', 'interest', 'retargeting_vc', 'retargeting_atc', 'retargeting_purchase', 'lookalike', 'lookalike_broad'] },
  { level: 8, name: 'Imperio',      check: e => e.Purchase.count_180d >= 1000,      strategies: ['TOFU', 'MOFU', 'BOFU'], audienceTypes: ['broad', 'interest', 'retargeting_vc', 'retargeting_atc', 'retargeting_purchase', 'lookalike', 'lookalike_broad', 'expansion'] },
]

async function fetchPixelStats(
  pixelId: string,
  token: string,
  eventName: string,
  daysBack: number,
): Promise<number> {
  try {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]
    const url = `${GRAPH}/${pixelId}/stats?aggregation=event&event=${eventName}&since=${since}&until=${until}&access_token=${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn(`[pixel-analyzer] ${eventName} (${daysBack}d): ${data.error.message}`)
      return 0
    }
    return data.data?.reduce((sum: number, d: any) => sum + (parseInt(d.count) || 0), 0) || 0
  } catch {
    return 0
  }
}

export async function analyzePixel(pixelId: string, accessToken: string): Promise<PixelAnalysis> {
  const eventNames = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'] as const
  const periods = [7, 30, 180]

  const events: PixelEvents = {
    PageView:         { count_7d: 0, count_30d: 0, count_180d: 0 },
    ViewContent:      { count_7d: 0, count_30d: 0, count_180d: 0 },
    AddToCart:        { count_7d: 0, count_30d: 0, count_180d: 0 },
    InitiateCheckout: { count_7d: 0, count_30d: 0, count_180d: 0 },
    Purchase:         { count_7d: 0, count_30d: 0, count_180d: 0, value_30d: 0 },
  }

  // Fetch all stats in parallel
  const promises: Promise<void>[] = []
  for (const eventName of eventNames) {
    for (const days of periods) {
      promises.push(
        fetchPixelStats(pixelId, accessToken, eventName, days).then(count => {
          const key = `count_${days}d` as 'count_7d' | 'count_30d' | 'count_180d'
          ;(events[eventName] as any)[key] = count
        }),
      )
    }
  }
  await Promise.all(promises)

  console.log('[pixel-analyzer] Events:', JSON.stringify(events))

  // Walk levels from highest → lowest, pick the first that matches
  let level = 0
  let levelName = 'Sin Data'
  let strategies: string[] = ['TOFU']
  let audienceTypes: string[] = ['broad']
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (LEVELS[i].check(events)) {
      level = LEVELS[i].level
      levelName = LEVELS[i].name
      strategies = LEVELS[i].strategies
      audienceTypes = LEVELS[i].audienceTypes
      break
    }
  }

  const canRetargetViewContent = events.ViewContent.count_30d >= 100
  const canRetargetAddToCart   = events.AddToCart.count_30d >= 50
  const canRetargetPurchase    = events.Purchase.count_30d >= 20
  const canCreateLookalike     = events.Purchase.count_180d >= 100

  const recommendations: string[] = []
  if (level === 0) recommendations.push('Instalá el pixel de Meta en tu sitio web para empezar a recopilar datos')
  if (level <= 2) recommendations.push('Enfocate en campañas TOFU para generar tráfico y alimentar el pixel')
  if (level === 3 && !canRetargetAddToCart) recommendations.push('Estás cerca de poder hacer retargeting de carrito. Seguí generando tráfico.')
  if (canRetargetViewContent && !canRetargetAddToCart) recommendations.push('Ya podés hacer retargeting de visitantes. Activá una campaña MOFU.')
  if (canRetargetPurchase && !canCreateLookalike) recommendations.push('Tus compradores crecen. Cuando llegues a 100 compras podrás crear Lookalikes.')
  if (canCreateLookalike) recommendations.push('Ya tenés suficientes compras para Lookalike Audiences. Activá BOFU.')

  return {
    pixelId, events, level, levelName,
    canRetargetViewContent, canRetargetAddToCart, canRetargetPurchase, canCreateLookalike,
    availableStrategies: strategies,
    availableAudienceTypes: audienceTypes,
    recommendations,
  }
}

export async function savePixelAnalysis(userId: string, analysis: PixelAnalysis) {
  const db = createAdminClient()

  // Track level transitions
  const { data: existing } = await db
    .from('pixel_analysis')
    .select('level')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing && existing.level !== analysis.level) {
    await db.from('level_history').insert({
      user_id: userId,
      old_level: existing.level,
      new_level: analysis.level,
      level_name: analysis.levelName,
      reason: 'Pixel analysis update',
    })

    // Notify only on level-ups (not downgrades)
    if (existing.level < analysis.level) {
      try {
        const { createNotification } = await import('@/lib/notification-engine')
        await createNotification({
          userId,
          type: 'level_up',
          title: `¡Subiste a Nivel ${analysis.level}: ${analysis.levelName}!`,
          body: 'Tu negocio creció y desbloqueaste nuevas capacidades. Revisá qué podés hacer ahora.',
          severity: 'success',
          actionUrl: '/dashboard/pixel',
          metadata: { old_level: existing.level, new_level: analysis.level, level_name: analysis.levelName },
        })
      } catch (e) {
        console.warn('[pixel-analyzer] level-up notification failed:', e)
      }

      // Strategic memory: a level-up completes any pending "grow_*" actions
      try {
        const { markActionCompleted } = await import('@/lib/memory-engine')
        await markActionCompleted(userId, 'grow_vc')
        await markActionCompleted(userId, 'grow_traffic')
      } catch (e) {
        console.warn('[pixel-analyzer] memory completion failed:', e)
      }
    }
  }

  await db.from('pixel_analysis').upsert({
    user_id: userId,
    pixel_id: analysis.pixelId,
    events_data: analysis.events,
    level: analysis.level,
    level_name: analysis.levelName,
    can_retarget_view_content: analysis.canRetargetViewContent,
    can_retarget_add_to_cart: analysis.canRetargetAddToCart,
    can_retarget_purchase: analysis.canRetargetPurchase,
    can_create_lookalike: analysis.canCreateLookalike,
    total_page_views_30d: analysis.events.PageView.count_30d,
    total_view_content_30d: analysis.events.ViewContent.count_30d,
    total_add_to_cart_30d: analysis.events.AddToCart.count_30d,
    total_purchases_30d: analysis.events.Purchase.count_30d,
    total_purchases_180d: analysis.events.Purchase.count_180d,
    purchase_value_30d: analysis.events.Purchase.value_30d,
    available_strategies: analysis.availableStrategies,
    available_audience_types: analysis.availableAudienceTypes,
    analyzed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}
