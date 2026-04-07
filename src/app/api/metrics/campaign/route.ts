// src/app/api/metrics/campaign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('id')
  const days = Number(searchParams.get('days') || '30')
  if (!campaignId) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('campaign_metrics_daily')
    .select('*')
    .eq('user_id', user.id)
    .eq('campaign_id', campaignId)
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data || [] })
}
