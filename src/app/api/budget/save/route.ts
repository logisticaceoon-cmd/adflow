// src/app/api/budget/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const totalBudget = Number(body?.total_budget)
  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json({ error: 'total_budget requerido' }, { status: 400 })
  }

  const monthYear = body?.month_year || new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const { error } = await supabase.from('monthly_budgets').upsert({
    user_id:                   user.id,
    month_year:                monthYear,
    total_budget:              totalBudget,
    currency:                  body?.currency   || 'USD',
    avg_ticket:                body?.avg_ticket  ?? null,
    margin_pct:                body?.margin_pct  ?? null,
    target_roas:               body?.target_roas ?? null,
    phase_budgets:             body?.phase_budgets             || {},
    phase_budgets_recommended: body?.phase_budgets_recommended || {},
    phase_results:             body?.phase_results             || {},
  }, { onConflict: 'user_id,month_year' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, month_year: monthYear })
}
