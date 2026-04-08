// src/app/api/automation/executions/route.ts
// GET  → list of recent executions (optionally filtered by ?status=pending)
// POST → { action: 'approve' | 'reject', execution_id }
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveExecution, rejectExecution } from '@/lib/automation-engine'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('automation_executions')
    .select('*, automation_rules(name, rule_type, description, conditions, actions)')
    .eq('user_id', user.id)
    .order('triggered_at', { ascending: false })
    .limit(20)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ executions: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action: string = String(body?.action || '')
  const executionId: string = String(body?.execution_id || '')

  if (!executionId) {
    return NextResponse.json({ error: 'execution_id requerido' }, { status: 400 })
  }

  if (action === 'approve') {
    const result = await approveExecution(user.id, executionId)
    return NextResponse.json(result)
  }

  if (action === 'reject') {
    const ok = await rejectExecution(user.id, executionId)
    return NextResponse.json({ success: ok, message: ok ? 'Rechazada' : 'No se pudo rechazar' })
  }

  return NextResponse.json({ error: 'action inválida' }, { status: 400 })
}
