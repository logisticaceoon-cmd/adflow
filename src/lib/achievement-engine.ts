// src/lib/achievement-engine.ts
// Persistent achievement evaluation engine.
// Reads user state (pixel analysis, campaigns, sync logs, budgets, monthly reports)
// and unlocks any newly-qualifying definitions from the catalog.
// Idempotent: already-unlocked achievements are skipped.
import { createAdminClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notification-engine'

export interface AchievementUnlock {
  id: string
  code: string
  name: string
  icon: string
  description: string
  rarity: string
}

interface AchievementDefinition {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  condition_type: string
  threshold: number
  rarity: string
  order_index: number
}

export async function evaluateAchievements(userId: string): Promise<AchievementUnlock[]> {
  const db = createAdminClient()
  const newUnlocks: AchievementUnlock[] = []

  // 1. Load catalog
  const { data: definitions } = await db
    .from('achievement_definitions')
    .select('*')
    .order('order_index')

  if (!definitions?.length) return []

  // 2. Load already-unlocked achievements for this user
  const { data: existing } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = new Set((existing || []).map((e: { achievement_id: string }) => e.achievement_id))

  // 3. Load user state in parallel
  const [
    pixelRes,
    campaignsRes,
    syncRes,
    budgetsRes,
    reportsRes,
    countRes,
  ] = await Promise.all([
    db.from('pixel_analysis').select('*').eq('user_id', userId).maybeSingle(),
    db.from('campaigns').select('id, name, status, metrics, strategy_type').eq('user_id', userId),
    db.from('sync_logs').select('id').eq('user_id', userId).eq('status', 'success').limit(1),
    db.from('monthly_budgets').select('id').eq('user_id', userId).limit(1),
    db.from('monthly_reports').select('avg_roas').eq('user_id', userId),
    db.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const pixelAnalysis = pixelRes.data
  const allCampaigns: Array<{ metrics?: { roas?: number } }> = campaignsRes.data || []
  const syncLogs = syncRes.data || []
  const budgets = budgetsRes.data || []
  const monthlyReports: Array<{ avg_roas?: number }> = reportsRes.data || []
  const totalCampaigns = countRes.count || 0

  const level = pixelAnalysis?.level || 0
  const events = pixelAnalysis?.events_data || {}
  const purchases180d = events?.Purchase?.count_180d || 0
  const pageViews180d = events?.PageView?.count_180d || 0
  const bestRoas = allCampaigns.reduce((m, c) => Math.max(m, c.metrics?.roas || 0), 0)
  const hasBudget = budgets.length > 0
  const hasSync = syncLogs.length > 0
  const hasProfitableMonth = monthlyReports.some(r => (r.avg_roas || 0) >= 1)

  // 4. Evaluate each definition
  for (const def of definitions as AchievementDefinition[]) {
    if (unlockedIds.has(def.id)) continue

    let unlocked = false
    let context: Record<string, unknown> = {}

    switch (def.condition_type) {
      case 'campaign_count':
        unlocked = totalCampaigns >= def.threshold
        context = { campaigns: totalCampaigns }
        break
      case 'purchases_total':
        unlocked = purchases180d >= def.threshold
        context = { purchases: purchases180d }
        break
      case 'roas_above':
        unlocked = bestRoas >= def.threshold
        context = { best_roas: bestRoas }
        break
      case 'level_reached':
        unlocked = level >= def.threshold
        context = { level }
        break
      case 'budget_set':
        unlocked = hasBudget
        break
      case 'first_sync':
        unlocked = hasSync
        break
      case 'pageviews_total':
        unlocked = pageViews180d >= def.threshold
        context = { pageviews: pageViews180d }
        break
      case 'monthly_roas_above':
        unlocked = hasProfitableMonth
        break
    }

    if (!unlocked) continue

    const { error } = await db.from('user_achievements').insert({
      user_id: userId,
      achievement_id: def.id,
      source_context: context,
      notified: false,
    })

    if (!error) {
      newUnlocks.push({
        id: def.id,
        code: def.code,
        name: def.name,
        icon: def.icon,
        description: def.description,
        rarity: def.rarity,
      })
      console.log(`[achievements] User ${userId} unlocked: ${def.code} (${def.name})`)

      // Persistent notification (never blocks the unlock flow)
      try {
        await createNotification({
          userId,
          type: 'achievement_unlocked',
          title: `🏆 Nuevo logro: ${def.name}`,
          body: def.description,
          severity: 'success',
          actionUrl: '/dashboard/pixel',
          metadata: { achievement_code: def.code, rarity: def.rarity, icon: def.icon },
        })
      } catch (e) {
        console.warn('[achievements] notification failed:', e)
      }
    }
  }

  return newUnlocks
}

export async function markAchievementsNotified(userId: string, achievementIds: string[]) {
  if (!achievementIds.length) return
  const db = createAdminClient()
  await db
    .from('user_achievements')
    .update({ notified: true })
    .eq('user_id', userId)
    .in('achievement_id', achievementIds)
}

export interface UserAchievementRow {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  condition_type: string
  threshold: number
  rarity: string
  order_index: number
  unlocked: boolean
  unlocked_at: string | null
  source_context: Record<string, unknown> | null
  notified: boolean
}

export async function getUserAchievements(userId: string): Promise<UserAchievementRow[]> {
  const db = createAdminClient()

  const [defsRes, unlockedRes] = await Promise.all([
    db.from('achievement_definitions').select('*').order('order_index'),
    db.from('user_achievements')
      .select('achievement_id, unlocked_at, source_context, notified')
      .eq('user_id', userId),
  ])

  const definitions = (defsRes.data || []) as AchievementDefinition[]
  const unlocked = (unlockedRes.data || []) as Array<{
    achievement_id: string
    unlocked_at: string
    source_context: Record<string, unknown> | null
    notified: boolean
  }>

  const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u]))

  return definitions.map(def => {
    const u = unlockedMap.get(def.id)
    return {
      ...def,
      unlocked: !!u,
      unlocked_at: u?.unlocked_at || null,
      source_context: u?.source_context || null,
      notified: u?.notified ?? true,
    }
  })
}
