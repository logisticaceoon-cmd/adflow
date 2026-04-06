// src/app/api/budget/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recommendBudgetDistribution } from '@/lib/budget-engine'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const totalBudget = Number(body?.total_budget)
  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json({ error: 'total_budget requerido' }, { status: 400 })
  }
  const currency   = body?.currency   || 'USD'
  const avgTicket  = body?.avg_ticket  ? Number(body.avg_ticket)  : undefined
  const targetRoas = body?.target_roas ? Number(body.target_roas) : undefined

  // Read pixel level from analysis (defaults to 0 if missing)
  const { data: pa } = await supabase
    .from('pixel_analysis')
    .select('level')
    .eq('user_id', user.id)
    .maybeSingle()
  const pixelLevel = pa?.level ?? 0

  const recommendation = recommendBudgetDistribution(
    totalBudget, currency, pixelLevel, avgTicket, targetRoas,
  )
  return NextResponse.json({ recommendation, pixel_level: pixelLevel })
}
