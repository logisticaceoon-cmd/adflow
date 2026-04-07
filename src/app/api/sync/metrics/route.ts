// src/app/api/sync/metrics/route.ts — Manual sync trigger
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserMetrics, type DatePreset } from '@/lib/meta-sync-engine'

const VALID_PRESETS: DatePreset[] = ['yesterday', 'last_7d', 'last_14d', 'last_30d']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const datePreset = (VALID_PRESETS.includes(body?.date_preset) ? body.date_preset : 'last_7d') as DatePreset

  const result = await syncUserMetrics(user.id, datePreset)
  return NextResponse.json({ result })
}
