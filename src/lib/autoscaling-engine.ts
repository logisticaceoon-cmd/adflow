// src/lib/autoscaling-engine.ts
// STUB — Phase 4 preparation. These functions are not called from any live flow
// (verify with: git grep 'evaluateScalingRules\|createScalingRule'). Wire up
// when the rules UI and cron trigger are ready.
import type { ScalingRule } from '@/types/advanced'

/**
 * Evaluates all active scaling rules for a user.
 * Would be called from the daily cron after `syncUserMetrics`.
 *
 * Planned flow:
 *  1. Load active rules (scaling_rules WHERE user_id = ... AND is_active = true)
 *  2. For each rule, read campaign_metrics_daily for `conditionPeriod`
 *  3. Evaluate `{conditionMetric} {conditionOperator} {conditionValue}`
 *  4. Respect `cooldown_hours` vs `last_triggered_at`
 *  5. Execute action (call scale-budget / activate-campaign routes internally)
 *  6. Insert row in scaling_rule_logs
 *  7. Emit a persistent notification via notification-engine
 */
export async function evaluateScalingRules(userId: string): Promise<void> {
  console.log(`[autoscaling] Stub: evaluateScalingRules(${userId}) — not implemented yet`)
}

/**
 * Creates a new scaling rule (called from a future rules UI).
 * Returns the new rule id or null on failure.
 */
export async function createScalingRule(_rule: Omit<ScalingRule, 'id'>): Promise<string | null> {
  console.log('[autoscaling] Stub: createScalingRule — not implemented yet')
  return null
}

/**
 * Disables a rule without deleting it (preserves the log trail).
 */
export async function disableScalingRule(_ruleId: string): Promise<boolean> {
  console.log('[autoscaling] Stub: disableScalingRule — not implemented yet')
  return false
}
