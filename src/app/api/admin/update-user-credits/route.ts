// src/app/api/admin/update-user-credits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PLAN_CREDITS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  // Identify caller via session (regular client)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Use admin client (service role) to read role — bypasses RLS
  const db = createAdminClient()
  const { data: callerProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, credits_total, plan } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
  }
  if (credits_total === undefined && plan === undefined) {
    return NextResponse.json({ error: 'Se requiere credits_total o plan' }, { status: 400 })
  }

  const validPlans = ['free', 'starter', 'pro', 'agency']
  if (plan !== undefined && !validPlans.includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }
  if (credits_total !== undefined && (typeof credits_total !== 'number' || credits_total < 0)) {
    return NextResponse.json({ error: 'credits_total debe ser un número >= 0' }, { status: 400 })
  }

  // Build update payload:
  // - explicit credits_total always wins
  // - if only plan is provided, auto-set credits_total to plan default
  const updates: Record<string, unknown> = {}
  if (plan !== undefined) updates.plan = plan
  if (credits_total !== undefined) {
    updates.credits_total = credits_total
  } else if (plan !== undefined) {
    updates.credits_total = PLAN_CREDITS[plan] ?? 10
  }

  const { data: updated, error } = await db
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, plan, credits_total, credits_used')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, profile: updated })
}
