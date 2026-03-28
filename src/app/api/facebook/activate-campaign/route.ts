// src/app/api/facebook/activate-campaign/route.ts
// Activate or pause a Meta Ads campaign
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GRAPH = 'https://graph.facebook.com/v20.0'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { campaign_id, action } = body || {}

  if (!campaign_id || !action) {
    return NextResponse.json({ error: 'campaign_id y action requeridos' }, { status: 400 })
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('meta_campaign_id')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (!campaign?.meta_campaign_id) {
    return NextResponse.json({
      error: 'Esta campaña no fue publicada en Meta Ads todavía. Publicala primero usando el botón "Publicar en Facebook".',
    }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('facebook_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token) {
    return NextResponse.json({ error: 'Facebook no está conectado.' }, { status: 400 })
  }

  const metaStatus = action === 'activate' ? 'ACTIVE' : 'PAUSED'
  const appStatus  = action === 'activate' ? 'active'  : 'paused'

  const res  = await fetch(`${GRAPH}/${campaign.meta_campaign_id}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status: metaStatus, access_token: conn.access_token }),
  })
  const data = await res.json()

  if (data.error) {
    const msg = data.error.error_user_msg || data.error.message || JSON.stringify(data.error)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  await supabase.from('campaigns').update({
    meta_status: metaStatus,
    status:      appStatus,
  }).eq('id', campaign_id)

  return NextResponse.json({ success: true, status: metaStatus })
}
