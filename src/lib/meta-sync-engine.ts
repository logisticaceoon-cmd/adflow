// src/lib/meta-sync-engine.ts
// Syncs daily campaign + ad set metrics from Meta Ads API into Supabase.
// Source of truth for the dashboards, reports, phases, and monthly reports.
import { createAdminClient } from '@/lib/supabase/server'
import { evaluateAchievements } from '@/lib/achievement-engine'
import { createNotification } from '@/lib/notification-engine'

const GRAPH = 'https://graph.facebook.com/v20.0'
const INSIGHT_FIELDS = 'spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,action_values,date_start,date_stop,adset_name'

export type DatePreset = 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d'

export interface SyncResult {
  userId: string
  status: 'success' | 'partial' | 'failed'
  campaignsSynced: number
  adsetsSynced: number
  errors: string[]
  durationMs: number
}

// ── Phase classifier (shared across the app) ───────────────────────────────
export function classifyPhase(campaignName: string, strategyType?: string | null): string {
  const name = (campaignName || '').toLowerCase()
  const strategy = (strategyType || '').toUpperCase()

  // Strategy first
  if (strategy === 'BOFU') return 'F2'
  if (strategy === 'MOFU') return 'F3'

  // Name heuristics
  if (/remarketing|retargeting|\bf3\b/.test(name)) return 'F3'
  if (/whatsapp|mensaje|\bwa\b|\bf4\b/.test(name)) return 'F4'
  if (/reconocimiento|awareness|branding|\bf1\b/.test(name)) return 'F1'
  if (/venta|conversion|sales|\bf2\b/.test(name)) return 'F2'

  if (strategy === 'TOFU') return 'F1'
  return 'F2'
}

// ── Extract conversion events from Meta's actions array ───────────────────
function extractActions(actions: any[] | undefined, actionValues: any[] | undefined) {
  const result = { view_content: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, purchase_value: 0 }

  if (actions) {
    for (const a of actions) {
      const type = a.action_type || ''
      const val = parseInt(a.value) || 0
      if (type === 'view_content' || type === 'offsite_conversion.fb_pixel_view_content') result.view_content += val
      else if (type === 'add_to_cart' || type === 'offsite_conversion.fb_pixel_add_to_cart') result.add_to_cart += val
      else if (type === 'initiate_checkout' || type === 'offsite_conversion.fb_pixel_initiate_checkout') result.initiate_checkout += val
      else if (type === 'purchase' || type === 'offsite_conversion.fb_pixel_purchase') result.purchases += val
    }
  }
  if (actionValues) {
    for (const av of actionValues) {
      const type = av.action_type || ''
      const val = parseFloat(av.value) || 0
      if (type === 'purchase' || type === 'offsite_conversion.fb_pixel_purchase') result.purchase_value += val
    }
  }
  return result
}

// ── Fetch daily insights for a campaign or ad set ──────────────────────────
async function fetchInsights(objectId: string, token: string, datePreset: DatePreset): Promise<any[]> {
  try {
    const url = `${GRAPH}/${objectId}/insights?fields=${INSIGHT_FIELDS}&date_preset=${datePreset}&time_increment=1&access_token=${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn(`[meta-sync] Insights error for ${objectId}: ${data.error.message}`)
      return []
    }
    return data.data || []
  } catch (err: any) {
    console.warn(`[meta-sync] Fetch exception for ${objectId}: ${err.message}`)
    return []
  }
}

// ── Main sync function for one user ────────────────────────────────────────
export async function syncUserMetrics(
  userId: string,
  datePreset: DatePreset = 'last_7d',
): Promise<SyncResult> {
  const startTime = Date.now()
  const db = createAdminClient()
  const errors: string[] = []
  let campaignsSynced = 0
  let adsetsSynced = 0

  try {
    // 1) Facebook token
    const { data: conn } = await db
      .from('facebook_connections')
      .select('access_token, ad_account_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (!conn?.access_token) {
      return { userId, status: 'failed', campaignsSynced: 0, adsetsSynced: 0, errors: ['No Facebook token'], durationMs: Date.now() - startTime }
    }

    // 2) Ad account (prefer business_profile selection)
    const { data: biz } = await db
      .from('business_profiles')
      .select('selected_ad_account_id')
      .eq('user_id', userId)
      .maybeSingle()
    const adAccountId = biz?.selected_ad_account_id || conn.ad_account_id || ''

    // 3) Campaigns with meta_campaign_id
    const { data: campaigns } = await db
      .from('campaigns')
      .select('id, name, meta_campaign_id, meta_adset_ids, strategy_type, status')
      .eq('user_id', userId)
      .not('meta_campaign_id', 'is', null)
    if (!campaigns?.length) {
      const durationMs = Date.now() - startTime
      await db.from('sync_logs').insert({
        user_id: userId, sync_type: 'daily_metrics', status: 'success',
        campaigns_synced: 0, adsets_synced: 0, errors: [], duration_ms: durationMs,
        started_at: new Date(startTime).toISOString(), completed_at: new Date().toISOString(),
      })
      return { userId, status: 'success', campaignsSynced: 0, adsetsSynced: 0, errors: [], durationMs }
    }

    // 4) Loop campaigns
    for (const campaign of campaigns) {
      try {
        const phase = classifyPhase(campaign.name, campaign.strategy_type)
        const insights = await fetchInsights(campaign.meta_campaign_id as string, conn.access_token, datePreset)

        // Per-day upserts
        for (const day of insights) {
          const conv = extractActions(day.actions, day.action_values)
          const spend = parseFloat(day.spend) || 0
          const roas = spend > 0 ? conv.purchase_value / spend : 0
          const cpa  = conv.purchases > 0 ? spend / conv.purchases : 0

          await db.from('campaign_metrics_daily').upsert({
            user_id: userId,
            campaign_id: campaign.id,
            meta_campaign_id: campaign.meta_campaign_id,
            ad_account_id: adAccountId,
            date: day.date_start,
            spend,
            impressions: parseInt(day.impressions) || 0,
            reach: parseInt(day.reach) || 0,
            frequency: parseFloat(day.frequency) || 0,
            clicks: parseInt(day.clicks) || 0,
            ctr: parseFloat(day.ctr) || 0,
            cpc: parseFloat(day.cpc) || 0,
            cpm: parseFloat(day.cpm) || 0,
            view_content: conv.view_content,
            add_to_cart: conv.add_to_cart,
            initiate_checkout: conv.initiate_checkout,
            purchases: conv.purchases,
            purchase_value: conv.purchase_value,
            roas,
            cpa,
            phase,
            synced_at: new Date().toISOString(),
          }, { onConflict: 'campaign_id,date' })
        }

        // Aggregate totals and update campaigns.metrics as the summary
        const totals = insights.reduce((acc: any, day: any) => {
          const c = extractActions(day.actions, day.action_values)
          acc.spend       += parseFloat(day.spend) || 0
          acc.impressions += parseInt(day.impressions) || 0
          acc.clicks      += parseInt(day.clicks) || 0
          acc.conversions += c.purchases
          acc.revenue     += c.purchase_value
          return acc
        }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 })

        const summaryRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0
        const summaryCpa  = totals.conversions > 0 ? totals.spend / totals.conversions : 0
        const summaryCtr  = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0

        // Merge with existing metrics (preserve audience_log, publish_errors, etc)
        const { data: existingCampaign } = await db
          .from('campaigns')
          .select('metrics')
          .eq('id', campaign.id)
          .maybeSingle()
        const existingMetrics = (existingCampaign?.metrics as any) || {}

        await db.from('campaigns').update({
          metrics: {
            ...existingMetrics,
            spend: totals.spend,
            impressions: totals.impressions,
            clicks: totals.clicks,
            conversions: totals.conversions,
            revenue: totals.revenue,
            roas: summaryRoas,
            cpa: summaryCpa,
            ctr: summaryCtr,
            phase,
            last_sync: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        }).eq('id', campaign.id)

        campaignsSynced++

        // 5) Loop ad sets
        const adsetIds = (campaign.meta_adset_ids || []) as string[]
        for (const adsetId of adsetIds) {
          try {
            const adsetInsights = await fetchInsights(adsetId, conn.access_token, datePreset)
            for (const day of adsetInsights) {
              const c = extractActions(day.actions, day.action_values)
              const adsetSpend = parseFloat(day.spend) || 0
              await db.from('adset_metrics_daily').upsert({
                user_id: userId,
                campaign_id: campaign.id,
                meta_adset_id: adsetId,
                meta_campaign_id: campaign.meta_campaign_id,
                adset_name: day.adset_name || adsetId,
                date: day.date_start,
                spend: adsetSpend,
                impressions: parseInt(day.impressions) || 0,
                reach: parseInt(day.reach) || 0,
                clicks: parseInt(day.clicks) || 0,
                ctr: parseFloat(day.ctr) || 0,
                cpc: parseFloat(day.cpc) || 0,
                cpm: parseFloat(day.cpm) || 0,
                purchases: c.purchases,
                purchase_value: c.purchase_value,
                roas: adsetSpend > 0 ? c.purchase_value / adsetSpend : 0,
                cpa: c.purchases > 0 ? adsetSpend / c.purchases : 0,
                phase,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'meta_adset_id,date' })
            }
            adsetsSynced++
          } catch (adsetErr: any) {
            errors.push(`AdSet ${adsetId}: ${adsetErr.message}`)
          }
          // Rate limit: 200ms between ad set calls
          await new Promise(r => setTimeout(r, 200))
        }
      } catch (cErr: any) {
        errors.push(`Campaign ${campaign.name}: ${cErr.message}`)
      }
      // Rate limit: 300ms between campaigns
      await new Promise(r => setTimeout(r, 300))
    }

    const durationMs = Date.now() - startTime
    const status: SyncResult['status'] = errors.length === 0 ? 'success' : campaignsSynced > 0 ? 'partial' : 'failed'

    await db.from('sync_logs').insert({
      user_id: userId,
      sync_type: 'daily_metrics',
      status,
      campaigns_synced: campaignsSynced,
      adsets_synced: adsetsSynced,
      errors: errors.length > 0 ? errors : [],
      duration_ms: durationMs,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    })

    console.log(`[meta-sync] User ${userId}: ${campaignsSynced} campaigns, ${adsetsSynced} adsets, ${errors.length} errors, ${durationMs}ms`)

    // Notification: sync result
    try {
      if (status === 'failed') {
        await createNotification({
          userId,
          type: 'sync_failed',
          title: 'Error al sincronizar métricas',
          body: errors[0] || 'Verificá tu conexión con Facebook',
          severity: 'error',
          actionUrl: '/dashboard/settings',
        })
      } else if (campaignsSynced > 0) {
        await createNotification({
          userId,
          type: 'sync_completed',
          title: 'Métricas sincronizadas',
          body: `Se sincronizaron ${campaignsSynced} campañas y ${adsetsSynced} ad sets`,
          severity: 'success',
          actionUrl: '/dashboard/phases',
        })
      }
    } catch (err) {
      console.warn('[meta-sync] Failed to create sync notification:', err)
    }

    // Evaluate achievements after sync (non-blocking for the sync result itself)
    try {
      const newAchievements = await evaluateAchievements(userId)
      if (newAchievements.length > 0) {
        console.log(`[meta-sync] User ${userId} unlocked ${newAchievements.length} achievements:`, newAchievements.map(a => a.code))
      }
    } catch (err) {
      console.warn('[meta-sync] Achievement evaluation failed:', err)
    }

    return { userId, status, campaignsSynced, adsetsSynced, errors, durationMs }

  } catch (err: any) {
    const durationMs = Date.now() - startTime
    errors.push(`Fatal: ${err.message}`)
    await db.from('sync_logs').insert({
      user_id: userId, sync_type: 'daily_metrics', status: 'failed',
      campaigns_synced: campaignsSynced, adsets_synced: adsetsSynced,
      errors, duration_ms: durationMs,
      started_at: new Date(startTime).toISOString(), completed_at: new Date().toISOString(),
    })
    return { userId, status: 'failed', campaignsSynced, adsetsSynced, errors, durationMs }
  }
}
