// src/app/api/facebook/scale-budget/route.ts
// Scale the daily budget of all ad sets in a published Meta campaign.
// Applies the same multiplier (or new absolute value) to each ad set.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.facebook.com/v20.0'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { campaign_id, pct_change, new_daily_budget } = body || {}

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 })
  }
  if (pct_change === undefined && new_daily_budget === undefined) {
    return NextResponse.json({ error: 'pct_change o new_daily_budget requerido' }, { status: 400 })
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('meta_campaign_id, meta_adset_ids, daily_budget, name')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (!campaign?.meta_campaign_id) {
    return NextResponse.json({ error: 'Campaña no publicada en Meta' }, { status: 400 })
  }

  const adsetIds = (campaign.meta_adset_ids || []) as string[]
  if (adsetIds.length === 0) {
    return NextResponse.json({ error: 'La campaña no tiene ad sets en Meta' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('facebook_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!conn?.access_token) {
    return NextResponse.json({ error: 'Facebook no está conectado' }, { status: 400 })
  }

  const previousBudget = Number(campaign.daily_budget) || 0

  // Calculate new total budget in the user currency
  const newTotalBudget = new_daily_budget !== undefined
    ? Number(new_daily_budget)
    : previousBudget * (1 + (Number(pct_change) || 0) / 100)

  if (newTotalBudget <= 0) {
    return NextResponse.json({ error: 'El nuevo presupuesto debe ser mayor a 0' }, { status: 400 })
  }

  // Split equally among ad sets (Meta expects cents)
  const perAdsetCents = Math.max(100, Math.round((newTotalBudget / adsetIds.length) * 100))

  const updated: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const adsetId of adsetIds) {
    try {
      const res = await fetch(`${GRAPH}/${adsetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_budget: perAdsetCents,
          access_token: conn.access_token,
        }),
      })
      const data = await res.json()
      if (data.error) {
        failed.push({ id: adsetId, error: data.error.error_user_msg || data.error.message || 'Unknown' })
        continue
      }
      updated.push(adsetId)
    } catch (err: any) {
      failed.push({ id: adsetId, error: err.message || 'Exception' })
    }
    await new Promise(r => setTimeout(r, 200))
  }

  // Update campaign row with the new daily budget (total, in user currency)
  await supabase.from('campaigns').update({
    daily_budget: newTotalBudget,
    updated_at:   new Date().toISOString(),
  }).eq('id', campaign_id)

  // Log action
  const status = failed.length === 0 ? 'success' : updated.length > 0 ? 'partial' : 'failed'
  await supabase.from('campaign_actions').insert({
    user_id: user.id,
    campaign_id,
    meta_campaign_id: campaign.meta_campaign_id,
    action_type: 'scale_budget',
    status,
    previous_value: { daily_budget: previousBudget },
    new_value: { daily_budget: newTotalBudget, per_adset_cents: perAdsetCents, updated_adsets: updated.length },
    error_message: failed.length > 0 ? failed.map(f => `${f.id}: ${f.error}`).join(' | ') : null,
  })

  if (status === 'failed') {
    return NextResponse.json({
      error: `No se pudo actualizar ningún ad set. Primer error: ${failed[0]?.error}`,
    }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    status,
    previous_budget: previousBudget,
    new_budget: newTotalBudget,
    updated_adsets: updated.length,
    failed_adsets: failed.length,
  })
}
