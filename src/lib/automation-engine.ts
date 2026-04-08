// src/lib/automation-engine.ts
// Automation rules engine: evaluates user-defined rules against real campaign
// metrics, executes actions against Meta when approved, and persists the full
// audit trail (automation_rules + automation_executions + campaign_actions).
//
// Companion of the legacy `autoscaling-engine.ts` stub — both coexist; the
// stub is preserved for Phase 4 foundation but is not called from anywhere.
import { createAdminClient } from '@/lib/supabase/server'
import { createNotification } from './notification-engine'
import { markActionCompleted } from './memory-engine'

const GRAPH = 'https://graph.facebook.com/v20.0'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ConditionOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
export type ConditionMetric   = 'roas' | 'cpa' | 'ctr' | 'spend' | 'frequency' | 'purchases' | 'clicks'
export type ConditionPeriod   = 'last_1d' | 'last_3d' | 'last_7d'

export interface RuleCondition {
  metric: ConditionMetric
  operator: ConditionOperator
  value: number
  period: ConditionPeriod
  /** Minimum spend (in user currency) for the rule to apply — prevents
   *  false positives on campaigns with too little data. */
  min_spend?: number
}

export type RuleActionType =
  | 'scale_budget_pct'
  | 'scale_budget_abs'
  | 'pause_campaign'
  | 'send_alert'
  | 'suggest_action'

export interface RuleAction {
  type: RuleActionType
  /** For scale_budget_pct: percentage delta (e.g. 15 = +15%).
   *  For scale_budget_abs: new absolute daily budget in user currency. */
  value?: number
  /** For send_alert / suggest_action: user-facing message. */
  message?: string
}

interface CampaignRow {
  id: string
  name: string
  status: string
  daily_budget: number
  meta_campaign_id: string | null
  meta_adset_ids: string[] | null
  strategy_type: string | null
}

interface AutomationRuleRow {
  id: string
  user_id: string
  entity_type: string
  entity_id: string | null
  rule_type: string
  name: string
  description: string | null
  conditions: RuleCondition
  actions: RuleAction
  is_enabled: boolean
  auto_execute: boolean
  approval_required: boolean
  cooldown_hours: number
  last_triggered_at: string | null
  trigger_count: number
  max_triggers: number | null
  source: string
  priority: number
}

// ═══════════════════════════════════════════════════════════════
// CONDITION EVALUATION
// ═══════════════════════════════════════════════════════════════

function evaluateCondition(condition: RuleCondition, metrics: Record<string, number>): boolean {
  const actual = metrics[condition.metric] ?? 0

  // Guard: minimum spend threshold to avoid noisy decisions
  if (condition.min_spend && (metrics.spend || 0) < condition.min_spend) {
    return false
  }

  switch (condition.operator) {
    case 'gt':  return actual >  condition.value
    case 'lt':  return actual <  condition.value
    case 'gte': return actual >= condition.value
    case 'lte': return actual <= condition.value
    case 'eq':  return actual === condition.value
    default:    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// METRICS AGGREGATION (from campaign_metrics_daily)
// ═══════════════════════════════════════════════════════════════

async function getMetricsForPeriod(
  db: ReturnType<typeof createAdminClient>,
  campaignId: string,
  period: ConditionPeriod,
): Promise<Record<string, number>> {
  const daysMap: Record<ConditionPeriod, number> = { last_1d: 1, last_3d: 3, last_7d: 7 }
  const days = daysMap[period] || 3
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data } = await db
    .from('campaign_metrics_daily')
    .select('spend, impressions, clicks, purchases, purchase_value, frequency')
    .eq('campaign_id', campaignId)
    .gte('date', since)

  const zeros = { spend: 0, roas: 0, cpa: 0, ctr: 0, cpc: 0, cpm: 0, purchases: 0, clicks: 0, impressions: 0, frequency: 0 }
  if (!data?.length) return zeros

  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0
  let totalPurchases = 0
  let totalPurchaseValue = 0
  let freqSum = 0
  let freqDays = 0

  for (const row of data as any[]) {
    totalSpend         += Number(row.spend || 0)
    totalImpressions   += Number(row.impressions || 0)
    totalClicks        += Number(row.clicks || 0)
    totalPurchases     += Number(row.purchases || 0)
    totalPurchaseValue += Number(row.purchase_value || 0)
    if (row.frequency) { freqSum += Number(row.frequency); freqDays++ }
  }

  return {
    spend:       totalSpend,
    impressions: totalImpressions,
    clicks:      totalClicks,
    purchases:   totalPurchases,
    roas:        totalSpend > 0 ? totalPurchaseValue / totalSpend : 0,
    cpa:         totalPurchases > 0 ? totalSpend / totalPurchases : 0,
    ctr:         totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpc:         totalClicks > 0 ? totalSpend / totalClicks : 0,
    cpm:         totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    frequency:   freqDays > 0 ? freqSum / freqDays : 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION EXECUTION (direct Meta API calls)
// ═══════════════════════════════════════════════════════════════

interface ExecutionResult {
  success: boolean
  message: string
  afterState?: Record<string, unknown>
}

async function executeAction(
  action: RuleAction,
  campaign: CampaignRow,
  token: string,
  db: ReturnType<typeof createAdminClient>,
): Promise<ExecutionResult> {
  try {
    // ── PAUSE CAMPAIGN ───────────────────────────────────────
    if (action.type === 'pause_campaign') {
      const adsetIds = (campaign.meta_adset_ids || []) as string[]
      for (const adsetId of adsetIds) {
        const res = await fetch(`${GRAPH}/${adsetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PAUSED', access_token: token }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'Meta API error')
        await new Promise(r => setTimeout(r, 200))
      }
      await db.from('campaigns').update({
        status: 'paused',
        meta_status: 'PAUSED',
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id)
      return {
        success: true,
        message: `Campaña "${campaign.name}" pausada`,
        afterState: { status: 'paused' },
      }
    }

    // ── SCALE BUDGET BY PERCENTAGE ───────────────────────────
    if (action.type === 'scale_budget_pct' && typeof action.value === 'number') {
      const currentBudget = Number(campaign.daily_budget || 0)
      const newBudget = Math.round(currentBudget * (1 + action.value / 100))
      const adsetIds = (campaign.meta_adset_ids || []) as string[]
      if (adsetIds.length === 0) {
        return { success: false, message: 'La campaña no tiene ad sets publicados' }
      }
      const perAdsetCents = Math.round((newBudget / adsetIds.length) * 100)

      for (const adsetId of adsetIds) {
        const res = await fetch(`${GRAPH}/${adsetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daily_budget: perAdsetCents, access_token: token }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'Meta API error')
        await new Promise(r => setTimeout(r, 200))
      }

      await db.from('campaigns').update({
        daily_budget: newBudget,
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id)

      return {
        success: true,
        message: `Presupuesto escalado de $${currentBudget.toLocaleString('es')} a $${newBudget.toLocaleString('es')}/día (${action.value >= 0 ? '+' : ''}${action.value}%)`,
        afterState: { daily_budget: newBudget, previous_budget: currentBudget, pct_change: action.value },
      }
    }

    // ── SCALE BUDGET ABSOLUTE ────────────────────────────────
    if (action.type === 'scale_budget_abs' && typeof action.value === 'number') {
      const newBudget = Math.round(action.value)
      const adsetIds = (campaign.meta_adset_ids || []) as string[]
      if (adsetIds.length === 0) {
        return { success: false, message: 'La campaña no tiene ad sets publicados' }
      }
      const perAdsetCents = Math.round((newBudget / adsetIds.length) * 100)

      for (const adsetId of adsetIds) {
        const res = await fetch(`${GRAPH}/${adsetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daily_budget: perAdsetCents, access_token: token }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'Meta API error')
        await new Promise(r => setTimeout(r, 200))
      }

      await db.from('campaigns').update({
        daily_budget: newBudget,
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id)

      return {
        success: true,
        message: `Presupuesto ajustado a $${newBudget.toLocaleString('es')}/día`,
        afterState: { daily_budget: newBudget },
      }
    }

    // ── ALERT / SUGGESTION (no Meta API call) ────────────────
    if (action.type === 'send_alert' || action.type === 'suggest_action') {
      return {
        success: true,
        message: action.message || 'Alerta generada',
        afterState: { alert: true },
      }
    }

    return { success: false, message: `Tipo de acción no soportado: ${action.type}` }
  } catch (err: any) {
    return { success: false, message: `Error al ejecutar: ${err.message || 'unknown'}` }
  }
}

// ═══════════════════════════════════════════════════════════════
// EVALUATE ALL RULES FOR A USER
// ═══════════════════════════════════════════════════════════════

export interface AutomationResult {
  rulesEvaluated: number
  triggered: number
  executed: number
  pending: number
  failed: number
  results: Array<{
    ruleId: string
    ruleName: string
    campaignName: string
    status: string
    message: string
  }>
}

const EMPTY_RESULT: AutomationResult = {
  rulesEvaluated: 0, triggered: 0, executed: 0, pending: 0, failed: 0, results: [],
}

export async function evaluateAutomationRules(userId: string): Promise<AutomationResult> {
  const result: AutomationResult = { ...EMPTY_RESULT, results: [] }

  try {
    const db = createAdminClient()

    // 1) Active rules
    const { data: rules } = await db
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)

    if (!rules?.length) return result

    // 2) Meta token
    const { data: conn } = await db
      .from('facebook_connections')
      .select('access_token')
      .eq('user_id', userId)
      .maybeSingle()

    if (!conn?.access_token) return result

    // 3) Published campaigns
    const { data: campaigns } = await db
      .from('campaigns')
      .select('id, name, status, daily_budget, meta_campaign_id, meta_adset_ids, strategy_type')
      .eq('user_id', userId)
      .not('meta_campaign_id', 'is', null)

    if (!campaigns?.length) return result

    const typedCampaigns = campaigns as CampaignRow[]

    // 4) Evaluate each rule
    for (const ruleRaw of rules) {
      const rule = ruleRaw as AutomationRuleRow
      result.rulesEvaluated++

      // Cooldown guard
      if (rule.last_triggered_at) {
        const hoursSince = (Date.now() - new Date(rule.last_triggered_at).getTime()) / 3600000
        if (hoursSince < (rule.cooldown_hours || 24)) continue
      }

      // Max triggers guard
      if (rule.max_triggers && rule.trigger_count >= rule.max_triggers) continue

      // Target campaigns (specific or all active)
      const targets = rule.entity_id
        ? typedCampaigns.filter(c => c.id === rule.entity_id)
        : typedCampaigns.filter(c => c.status === 'active')

      for (const campaign of targets) {
        const condition = rule.conditions
        const action = rule.actions

        const metrics = await getMetricsForPeriod(db, campaign.id, condition.period || 'last_3d')
        if (!evaluateCondition(condition, metrics)) continue

        result.triggered++

        const beforeState = {
          status: campaign.status,
          daily_budget: campaign.daily_budget,
          metrics,
        }

        // AUTO-EXECUTE PATH
        if (rule.auto_execute && !rule.approval_required) {
          const execResult = await executeAction(action, campaign, conn.access_token, db)

          await db.from('automation_executions').insert({
            rule_id: rule.id,
            user_id: userId,
            entity_type: 'campaign',
            entity_id: campaign.id,
            entity_name: campaign.name,
            status: execResult.success ? 'executed' : 'failed',
            decision_snapshot: metrics,
            before_state: beforeState,
            after_state: execResult.afterState || {},
            result_message: execResult.message,
            error_message: execResult.success ? null : execResult.message,
            requires_approval: false,
            executed_at: execResult.success ? new Date().toISOString() : null,
          })

          if (execResult.success) {
            result.executed++

            // Mirror to legacy campaign_actions for unified history
            await db.from('campaign_actions').insert({
              user_id: userId,
              campaign_id: campaign.id,
              meta_campaign_id: campaign.meta_campaign_id,
              action_type: action.type,
              status: 'success',
              previous_value: beforeState,
              new_value: execResult.afterState || {},
              source: 'automation',
            })

            // Notification
            try {
              await createNotification({
                userId,
                type: 'automation_executed',
                title: `⚡ Automatización ejecutada: ${rule.name}`,
                body: execResult.message,
                severity: 'info',
                actionUrl: `/dashboard/campaigns/${campaign.id}`,
              })
            } catch { /* ignore notification failure */ }
          } else {
            result.failed++
          }

          result.results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            campaignName: campaign.name,
            status: execResult.success ? 'executed' : 'failed',
            message: execResult.message,
          })
        } else {
          // APPROVAL-REQUIRED PATH — create pending execution
          await db.from('automation_executions').insert({
            rule_id: rule.id,
            user_id: userId,
            entity_type: 'campaign',
            entity_id: campaign.id,
            entity_name: campaign.name,
            status: 'pending',
            decision_snapshot: metrics,
            before_state: beforeState,
            after_state: {},
            requires_approval: true,
          })

          result.pending++

          try {
            await createNotification({
              userId,
              type: 'automation_suggestion',
              title: `💡 Sugerencia: ${rule.name}`,
              body: `"${campaign.name}" cumple las condiciones. Revisá y aprobá la acción.`,
              severity: 'info',
              actionUrl: '/dashboard/automation',
            })
          } catch { /* ignore */ }

          result.results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            campaignName: campaign.name,
            status: 'pending',
            message: 'Sugerencia generada para aprobación',
          })
        }

        // Update rule's trigger bookkeeping
        await db.from('automation_rules').update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: (rule.trigger_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', rule.id)

        // Only one trigger per rule per evaluation cycle
        break
      }
    }

    return result
  } catch (err: any) {
    console.warn('[automation-engine] evaluate error:', err?.message || err)
    return result
  }
}

// ═══════════════════════════════════════════════════════════════
// APPROVE A PENDING EXECUTION
// ═══════════════════════════════════════════════════════════════

export async function approveExecution(
  userId: string,
  executionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const db = createAdminClient()

    // Fetch execution + its rule
    const { data: execution } = await db
      .from('automation_executions')
      .select('*, automation_rules(*)')
      .eq('id', executionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (!execution) {
      return { success: false, message: 'Ejecución no encontrada o ya procesada' }
    }

    const { data: campaign } = await db
      .from('campaigns')
      .select('id, name, status, daily_budget, meta_campaign_id, meta_adset_ids, strategy_type')
      .eq('id', execution.entity_id)
      .maybeSingle()

    const { data: conn } = await db
      .from('facebook_connections')
      .select('access_token')
      .eq('user_id', userId)
      .maybeSingle()

    if (!campaign || !conn?.access_token) {
      return { success: false, message: 'Campaña o conexión con Meta no encontrada' }
    }

    const rule = (execution as any).automation_rules as AutomationRuleRow | null
    if (!rule) {
      return { success: false, message: 'Regla asociada no encontrada' }
    }

    const result = await executeAction(rule.actions, campaign as CampaignRow, conn.access_token, db)

    await db.from('automation_executions').update({
      status: result.success ? 'executed' : 'failed',
      approved_at: new Date().toISOString(),
      executed_at: result.success ? new Date().toISOString() : null,
      after_state: result.afterState || {},
      result_message: result.message,
      error_message: result.success ? null : result.message,
    }).eq('id', executionId)

    if (result.success) {
      // Mirror to campaign_actions
      await db.from('campaign_actions').insert({
        user_id: userId,
        campaign_id: campaign.id,
        meta_campaign_id: (campaign as any).meta_campaign_id,
        action_type: rule.actions.type,
        status: 'success',
        previous_value: execution.before_state,
        new_value: result.afterState || {},
        source: 'automation_approved',
      })

      // Memory engine — mark this automation as completed
      try {
        await markActionCompleted(userId, `automation_${rule.rule_type}_${campaign.id}`)
      } catch { /* ignore */ }

      // Notification
      try {
        await createNotification({
          userId,
          type: 'automation_executed',
          title: `⚡ Automatización aprobada: ${rule.name}`,
          body: result.message,
          severity: 'success',
          actionUrl: `/dashboard/campaigns/${campaign.id}`,
        })
      } catch { /* ignore */ }
    }

    return result
  } catch (err: any) {
    return { success: false, message: `Error al aprobar: ${err?.message || 'unknown'}` }
  }
}

// ═══════════════════════════════════════════════════════════════
// REJECT A PENDING EXECUTION
// ═══════════════════════════════════════════════════════════════

export async function rejectExecution(userId: string, executionId: string): Promise<boolean> {
  try {
    const db = createAdminClient()
    const { error } = await db
      .from('automation_executions')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .eq('user_id', userId)
      .eq('status', 'pending')
    return !error
  } catch (err: any) {
    console.warn('[automation-engine] reject error:', err?.message || err)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// CREATE DEFAULT RULES (system templates, disabled by default)
// ═══════════════════════════════════════════════════════════════

export async function createDefaultRules(userId: string): Promise<number> {
  try {
    const db = createAdminClient()

    const { count } = await db
      .from('automation_rules')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((count || 0) > 0) return 0

    const defaults = [
      {
        rule_type: 'scale_up',
        name: 'Escalar si ROAS > 3 por 3 días',
        description: 'Si una campaña activa tiene ROAS ≥ 3x durante 3 días consecutivos, sugiere escalar el presupuesto un 15%.',
        conditions: { metric: 'roas', operator: 'gte', value: 3, period: 'last_3d', min_spend: 5000 },
        actions:    { type: 'scale_budget_pct', value: 15 },
        cooldown_hours: 72,
        priority: 1,
      },
      {
        rule_type: 'pause',
        name: 'Pausar si ROAS < 1 por 3 días',
        description: 'Si una campaña activa tiene ROAS < 1x durante 3 días con gasto mínimo, sugiere pausarla.',
        conditions: { metric: 'roas', operator: 'lt', value: 1, period: 'last_3d', min_spend: 10000 },
        actions:    { type: 'pause_campaign' },
        cooldown_hours: 48,
        priority: 2,
      },
      {
        rule_type: 'alert',
        name: 'Alerta si CPA sube mucho',
        description: 'Si el costo por adquisición supera un umbral, alerta para revisar la campaña.',
        conditions: { metric: 'cpa', operator: 'gte', value: 50000, period: 'last_3d' },
        actions:    { type: 'send_alert', message: 'Tu CPA está alto. Revisá creativos y audiencias.' },
        cooldown_hours: 48,
        priority: 3,
      },
      {
        rule_type: 'scale_up',
        name: 'Escalar si ROAS > 5 por 7 días',
        description: 'ROAS excepcional sostenido. Oportunidad de escalar agresivamente (+20%).',
        conditions: { metric: 'roas', operator: 'gte', value: 5, period: 'last_7d', min_spend: 10000 },
        actions:    { type: 'scale_budget_pct', value: 20 },
        cooldown_hours: 168,
        priority: 4,
      },
    ]

    let created = 0
    for (const rule of defaults) {
      const { error } = await db.from('automation_rules').insert({
        user_id: userId,
        entity_type: 'campaign',
        entity_id: null,
        is_enabled: false,
        auto_execute: false,
        approval_required: true,
        source: 'system',
        ...rule,
      })
      if (!error) created++
    }
    return created
  } catch (err: any) {
    console.warn('[automation-engine] createDefaultRules error:', err?.message || err)
    return 0
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS for other modules (dashboard, UI)
// ═══════════════════════════════════════════════════════════════

export async function countPendingExecutions(userId: string): Promise<number> {
  try {
    const db = createAdminClient()
    const { count } = await db
      .from('automation_executions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
    return count || 0
  } catch {
    return 0
  }
}
