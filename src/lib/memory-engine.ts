// src/lib/memory-engine.ts
// Persistent strategic memory. Feeds decisions back to the decision engine so:
//   • completed actions are not suggested again
//   • repeatedly-ignored actions get framed differently
//   • action clicks are tracked for impact analysis
//
// All public functions are internally wrapped in try/catch — a memory failure
// NEVER breaks the calling flow (dashboard render, API route, etc.).
import { createAdminClient } from '@/lib/supabase/server'

// ═══════════════════════════════════════════════════════════════
// SAVE — persist a newly generated decision
// ═══════════════════════════════════════════════════════════════

export interface SaveDecisionInput {
  userId: string
  primaryActionId: string
  primaryActionTitle: string
  primaryActionPriority: string
  primaryActionImpact: string
  primaryActionReason?: string
  secondaryActionIds: string[]
  contextSnapshot: Record<string, unknown>
}

export async function saveDecision(input: SaveDecisionInput): Promise<string | null> {
  try {
    const db = createAdminClient()

    // Supersede older "suggested" rows for the same action_id — only the latest
    // "suggested" matters. Completed/in_progress rows stay untouched.
    await db
      .from('strategic_decision_history')
      .update({ action_status: 'superseded' })
      .eq('user_id', input.userId)
      .eq('primary_action_id', input.primaryActionId)
      .eq('action_status', 'suggested')

    const { data, error } = await db
      .from('strategic_decision_history')
      .insert({
        user_id: input.userId,
        primary_action_id: input.primaryActionId,
        primary_action_title: input.primaryActionTitle,
        primary_action_priority: input.primaryActionPriority,
        primary_action_impact: input.primaryActionImpact,
        primary_action_reason: input.primaryActionReason || null,
        secondary_action_ids: input.secondaryActionIds,
        context_snapshot: input.contextSnapshot,
        action_status: 'suggested',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[memory-engine] saveDecision failed:', error.message)
      return null
    }
    return data?.id || null
  } catch (err: any) {
    console.warn('[memory-engine] saveDecision exception:', err?.message || err)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// READ — query memory to adjust future decisions
// ═══════════════════════════════════════════════════════════════

export interface DecisionMemory {
  recentDecisions: Array<{
    id: string
    primaryActionId: string
    primaryActionTitle: string
    actionStatus: string
    generatedAt: string
    clickedAt: string | null
    completedAt: string | null
  }>
  ignoredActions: string[]
  completedActions: string[]
  lastSuggestedActionId: string | null
  lastSuggestedAt: string | null
  repeatedSuggestions: Record<string, number>
}

const EMPTY_MEMORY: DecisionMemory = {
  recentDecisions: [],
  ignoredActions: [],
  completedActions: [],
  lastSuggestedActionId: null,
  lastSuggestedAt: null,
  repeatedSuggestions: {},
}

interface DecisionRow {
  id: string
  primary_action_id: string
  primary_action_title: string
  action_status: string
  generated_at: string
  clicked_at: string | null
  completed_at: string | null
}

export async function getDecisionMemory(
  userId: string,
  lookbackDays: number = 7,
): Promise<DecisionMemory> {
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - lookbackDays * 86400000).toISOString()

    const { data: recent, error } = await db
      .from('strategic_decision_history')
      .select('id, primary_action_id, primary_action_title, action_status, generated_at, clicked_at, completed_at')
      .eq('user_id', userId)
      .gte('generated_at', since)
      .order('generated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.warn('[memory-engine] getDecisionMemory query failed:', error.message)
      return EMPTY_MEMORY
    }

    const decisions: DecisionRow[] = (recent || []) as DecisionRow[]

    const completedSet = new Set<string>()
    for (const d of decisions) {
      if (d.action_status === 'completed' || d.action_status === 'in_progress') {
        completedSet.add(d.primary_action_id)
      }
    }

    const ignoredSet = new Set<string>()
    for (const d of decisions) {
      if (d.action_status === 'suggested' || d.action_status === 'superseded') {
        if (!completedSet.has(d.primary_action_id)) {
          ignoredSet.add(d.primary_action_id)
        }
      }
    }

    const repeatedSuggestions: Record<string, number> = {}
    for (const d of decisions) {
      if (d.action_status === 'suggested' || d.action_status === 'superseded') {
        repeatedSuggestions[d.primary_action_id] = (repeatedSuggestions[d.primary_action_id] || 0) + 1
      }
    }

    const lastSuggested = decisions.find(d => d.action_status === 'suggested')

    return {
      recentDecisions: decisions.map(d => ({
        id: d.id,
        primaryActionId: d.primary_action_id,
        primaryActionTitle: d.primary_action_title,
        actionStatus: d.action_status,
        generatedAt: d.generated_at,
        clickedAt: d.clicked_at,
        completedAt: d.completed_at,
      })),
      ignoredActions: [...ignoredSet],
      completedActions: [...completedSet],
      lastSuggestedActionId: lastSuggested?.primary_action_id || null,
      lastSuggestedAt: lastSuggested?.generated_at || null,
      repeatedSuggestions,
    }
  } catch (err: any) {
    console.warn('[memory-engine] getDecisionMemory exception:', err?.message || err)
    return EMPTY_MEMORY
  }
}

// ═══════════════════════════════════════════════════════════════
// TRACK — user clicked a CTA, mark decision as in_progress
// ═══════════════════════════════════════════════════════════════

export async function trackActionClick(
  userId: string,
  actionId: string,
  actionLabel: string,
  targetUrl: string,
  source: string = 'dashboard',
  contextMetrics?: Record<string, unknown>,
): Promise<void> {
  try {
    const db = createAdminClient()

    // 1) Append to the user actions log (always, regardless of matching decision)
    await db.from('user_actions_log').insert({
      user_id: userId,
      action_id: actionId,
      action_type: 'cta_click',
      action_label: actionLabel,
      source,
      target_url: targetUrl,
      context_metrics: contextMetrics || {},
    })

    // 2) Promote the most recent matching "suggested" decision → in_progress
    const { data: latest } = await db
      .from('strategic_decision_history')
      .select('id, context_snapshot')
      .eq('user_id', userId)
      .eq('primary_action_id', actionId)
      .eq('action_status', 'suggested')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest) {
      await db
        .from('strategic_decision_history')
        .update({
          action_status: 'in_progress',
          clicked_at: new Date().toISOString(),
          pre_metrics: latest.context_snapshot,
        })
        .eq('id', latest.id)
    }
  } catch (err: any) {
    console.warn('[memory-engine] trackActionClick exception:', err?.message || err)
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE — mark an action as completed + compute impact
// ═══════════════════════════════════════════════════════════════

export async function markActionCompleted(
  userId: string,
  actionId: string,
  postMetrics?: Record<string, unknown>,
): Promise<void> {
  try {
    const db = createAdminClient()

    const { data: decision } = await db
      .from('strategic_decision_history')
      .select('id, pre_metrics')
      .eq('user_id', userId)
      .eq('primary_action_id', actionId)
      .in('action_status', ['suggested', 'in_progress'])
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!decision) return

    // Compute simple impact score: delta in 30d purchases if both snapshots exist
    let impactScore: number | null = null
    const pre = decision.pre_metrics as Record<string, unknown> | null
    if (pre && postMetrics) {
      const prePurchases = Number((pre as any)?.purchases30d || 0)
      const postPurchases = Number((postMetrics as any)?.purchases30d || 0)
      if (prePurchases > 0) {
        impactScore = ((postPurchases - prePurchases) / prePurchases) * 100
      } else if (postPurchases > 0) {
        impactScore = 100 // went from 0 to something — bounded positive
      }
    }

    await db
      .from('strategic_decision_history')
      .update({
        action_status: 'completed',
        completed_at: new Date().toISOString(),
        post_metrics: postMetrics || null,
        impact_score: impactScore,
      })
      .eq('id', decision.id)
  } catch (err: any) {
    console.warn('[memory-engine] markActionCompleted exception:', err?.message || err)
  }
}

// ═══════════════════════════════════════════════════════════════
// DETECT — scan state and auto-complete actions whose preconditions were met
// ═══════════════════════════════════════════════════════════════

export async function detectCompletedActions(userId: string): Promise<string[]> {
  const completed: string[] = []

  try {
    const db = createAdminClient()

    const { data: pending } = await db
      .from('strategic_decision_history')
      .select('id, primary_action_id, context_snapshot')
      .eq('user_id', userId)
      .in('action_status', ['suggested', 'in_progress'])
      .order('generated_at', { ascending: false })
      .limit(10)

    if (!pending?.length) return []

    // Load current state in parallel
    const [campaignCountRes, budgetRes, pixelRes, syncRes, bizRes, fbRes] = await Promise.all([
      db.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      db.from('monthly_budgets').select('id').eq('user_id', userId).limit(1),
      db.from('pixel_analysis').select('level, events_data').eq('user_id', userId).maybeSingle(),
      db.from('sync_logs').select('id').eq('user_id', userId).eq('status', 'success').limit(1),
      db.from('business_profiles').select('pixel_id, selected_ad_account_id').eq('user_id', userId).maybeSingle(),
      db.from('facebook_connections').select('access_token').eq('user_id', userId).maybeSingle(),
    ])

    const campaignCount = campaignCountRes.count || 0
    const hasBudget = (budgetRes.data?.length || 0) > 0
    const currentLevel = pixelRes.data?.level || 0
    const currentVC = (pixelRes.data?.events_data as any)?.ViewContent?.count_30d || 0
    const currentPV = (pixelRes.data?.events_data as any)?.PageView?.count_30d || 0
    const hasSync = (syncRes.data?.length || 0) > 0
    const hasPixel = !!bizRes.data?.pixel_id
    const hasAdAccount = !!bizRes.data?.selected_ad_account_id
    const metaConnected = !!fbRes.data?.access_token

    for (const decision of pending) {
      const actionId = decision.primary_action_id
      const ctx = (decision.context_snapshot || {}) as Record<string, any>
      let isCompleted = false

      switch (actionId) {
        case 'first_campaign':
          if (campaignCount > (ctx.totalCampaigns || 0)) isCompleted = true
          break
        case 'set_budget':
          if (hasBudget) isCompleted = true
          break
        case 'first_sync':
          if (hasSync) isCompleted = true
          break
        case 'connect_meta':
          if (metaConnected) isCompleted = true
          break
        case 'configure_pixel':
          if (hasPixel) isCompleted = true
          break
        case 'complete_setup':
          if (metaConnected && hasAdAccount && hasPixel) isCompleted = true
          break
        case 'grow_vc':
          if (currentVC > (ctx.viewContent30d || 0) + 50 || currentLevel > (ctx.pixelLevel || 0)) isCompleted = true
          break
        case 'grow_traffic':
          if (currentPV > (ctx.pageViews30d || 0) + 50 || currentLevel > (ctx.pixelLevel || 0)) isCompleted = true
          break
        case 'token_expired':
          if (metaConnected) isCompleted = true
          break
      }

      if (isCompleted) {
        await markActionCompleted(userId, actionId, {
          campaignCount,
          hasBudget,
          pixelLevel: currentLevel,
          viewContent30d: currentVC,
          pageViews30d: currentPV,
          hasSynced: hasSync,
          metaConnected,
        })
        completed.push(actionId)
      }
    }
  } catch (err: any) {
    console.warn('[memory-engine] detectCompletedActions exception:', err?.message || err)
  }

  return completed
}
