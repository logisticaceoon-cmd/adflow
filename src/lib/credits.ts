// src/lib/credits.ts — server-only
import { createAdminClient } from '@/lib/supabase/server'
import type { PlanType, CreditsInfo } from '@/types'
import { PLAN_CREDITS } from '@/lib/plans'

export async function getCreditsInfo(userId: string): Promise<CreditsInfo | null> {
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('plan, credits_total, credits_used, credits_reset_date')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const total     = profile.credits_total ?? PLAN_CREDITS[profile.plan] ?? 10
  const used      = profile.credits_used  ?? 0
  const remaining = Math.max(0, total - used)

  return {
    plan:      (profile.plan as PlanType) || 'free',
    total,
    used,
    remaining,
    resetDate: profile.credits_reset_date ?? null,
  }
}

export async function resetCreditsIfNeeded(userId: string): Promise<void> {
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('credits_reset_date, plan')
    .eq('id', userId)
    .single()

  if (!profile?.credits_reset_date) return

  const resetDate = new Date(profile.credits_reset_date)
  if (new Date() < resetDate) return

  // Compute next reset: first day of next month
  const nextReset = new Date()
  nextReset.setDate(1)
  nextReset.setMonth(nextReset.getMonth() + 1)
  nextReset.setHours(0, 0, 0, 0)

  await db
    .from('profiles')
    .update({
      credits_used:       0,
      credits_total:      PLAN_CREDITS[profile.plan] ?? 10,
      credits_reset_date: nextReset.toISOString(),
    })
    .eq('id', userId)
}

export async function checkCredits(userId: string): Promise<boolean> {
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('credits_total, credits_used')
    .eq('id', userId)
    .single()

  if (!profile) return false
  return (profile.credits_used ?? 0) < (profile.credits_total ?? 10)
}

export async function useCredit(
  userId: string,
  action: string,
  campaignId?: string,
): Promise<void> {
  const db = createAdminClient()

  // Atomic increment via SQL function defined in migration
  await db.rpc('increment_credits_used', { p_user_id: userId })

  // Log to credit_usage history
  await db.from('credit_usage').insert({
    user_id:      userId,
    action,
    credits_used: 1,
    campaign_id:  campaignId ?? null,
  })
}

/**
 * Atomic credit consumption — validates balance, deducts, and logs in a single
 * SQL transaction. Prevents race conditions from concurrent generations.
 */
export async function consumeCredits(
  userId: string,
  action: string,
  cost: number = 1,
  campaignId?: string,
): Promise<{ success: boolean; creditsRemaining: number }> {
  const db = createAdminClient()

  const { data, error } = await db.rpc('consume_user_credits', {
    p_user_id:    userId,
    p_action:     action,
    p_cost:       cost,
    p_campaign_id: campaignId ?? null,
  })

  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  return {
    success:          row?.success          ?? false,
    creditsRemaining: row?.credits_remaining ?? 0,
  }
}
