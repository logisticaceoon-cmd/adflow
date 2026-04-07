// src/app/api/metrics/phases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PhaseAgg {
  spend: number
  revenue: number
  impressions: number
  clicks: number
  purchases: number
  roas: number
  cpa: number
  ctr: number
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const [y, m] = monthParam.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1).toISOString().split('T')[0]
  const lastDay  = new Date(y, m, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('campaign_metrics_daily')
    .select('phase, spend, purchase_value, impressions, clicks, purchases')
    .eq('user_id', user.id)
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const phases: Record<string, PhaseAgg> = {
    F1: { spend: 0, revenue: 0, impressions: 0, clicks: 0, purchases: 0, roas: 0, cpa: 0, ctr: 0 },
    F2: { spend: 0, revenue: 0, impressions: 0, clicks: 0, purchases: 0, roas: 0, cpa: 0, ctr: 0 },
    F3: { spend: 0, revenue: 0, impressions: 0, clicks: 0, purchases: 0, roas: 0, cpa: 0, ctr: 0 },
    F4: { spend: 0, revenue: 0, impressions: 0, clicks: 0, purchases: 0, roas: 0, cpa: 0, ctr: 0 },
  }

  for (const row of (data || [])) {
    const ph = row.phase || 'F2'
    if (!phases[ph]) continue
    phases[ph].spend       += Number(row.spend)          || 0
    phases[ph].revenue     += Number(row.purchase_value) || 0
    phases[ph].impressions += Number(row.impressions)    || 0
    phases[ph].clicks      += Number(row.clicks)         || 0
    phases[ph].purchases   += Number(row.purchases)      || 0
  }

  for (const ph of Object.keys(phases)) {
    const p = phases[ph]
    p.roas = p.spend       > 0 ? p.revenue / p.spend       : 0
    p.cpa  = p.purchases   > 0 ? p.spend   / p.purchases   : 0
    p.ctr  = p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0
  }

  return NextResponse.json({ month: monthParam, phases })
}
