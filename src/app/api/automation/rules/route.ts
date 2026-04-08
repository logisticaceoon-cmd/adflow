// src/app/api/automation/rules/route.ts
// CRUD for automation_rules — user can list, create, update, delete.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    rule_type, name, description, conditions, actions,
    cooldown_hours = 24, entity_id = null, entity_type = 'campaign',
    is_enabled = false, auto_execute = false, approval_required = true,
    max_triggers = null, priority = 0,
  } = body || {}

  if (!rule_type || !name || !conditions || !actions) {
    return NextResponse.json({ error: 'rule_type, name, conditions, actions requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      user_id: user.id,
      rule_type, name, description,
      conditions, actions,
      cooldown_hours,
      entity_id, entity_type,
      is_enabled, auto_execute, approval_required,
      max_triggers, priority,
      source: 'user',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, ...patch } = body || {}
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Only allow updating a safe subset of fields
  const allowed = [
    'name', 'description', 'conditions', 'actions',
    'is_enabled', 'auto_execute', 'approval_required',
    'cooldown_hours', 'max_triggers', 'priority',
  ]
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in patch) update[key] = patch[key]
  }

  const { data, error } = await supabase
    .from('automation_rules')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = body || {}
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
