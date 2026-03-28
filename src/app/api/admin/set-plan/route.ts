// src/app/api/admin/set-plan/route.ts
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
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { userId, plan } = await req.json()
  if (!userId || !plan) {
    return NextResponse.json({ error: 'userId y plan son requeridos' }, { status: 400 })
  }

  const validPlans = ['free', 'starter', 'pro', 'agency']
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }
  const { error } = await db
    .from('profiles')
    .update({
      plan,
      credits_total: PLAN_CREDITS[plan] ?? 10,
    })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
