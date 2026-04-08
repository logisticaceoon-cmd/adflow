// src/app/api/actions/track/route.ts
// POST endpoint that client components hit when the user clicks a CTA.
// Logs the click in user_actions_log and promotes the matching decision
// (if any) from 'suggested' to 'in_progress'.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackActionClick } from '@/lib/memory-engine'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const actionId: string = String(body?.action_id || '').trim()
  if (!actionId) {
    return NextResponse.json({ error: 'action_id requerido' }, { status: 400 })
  }
  const actionLabel: string = String(body?.action_label || '')
  const targetUrl: string = String(body?.target_url || '')
  const source: string = String(body?.source || 'dashboard')
  const contextMetrics = typeof body?.context_metrics === 'object' ? body.context_metrics : undefined

  await trackActionClick(user.id, actionId, actionLabel, targetUrl, source, contextMetrics)

  return NextResponse.json({ ok: true })
}
