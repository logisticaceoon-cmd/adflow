// src/app/api/budget/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notification-engine'
import { markActionCompleted } from '@/lib/memory-engine'

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
  const phaseBudgets = body?.phase_budgets || {}
  const currency = body?.currency || 'USD'

  const { error } = await supabase.from('monthly_budgets').upsert({
    user_id:                   user.id,
    month_year:                monthYear,
    total_budget:              totalBudget,
    currency,
    avg_ticket:                body?.avg_ticket  ?? null,
    margin_pct:                body?.margin_pct  ?? null,
    target_roas:               body?.target_roas ?? null,
    phase_budgets:             phaseBudgets,
    phase_budgets_recommended: body?.phase_budgets_recommended || {},
    phase_results:             body?.phase_results             || {},
  }, { onConflict: 'user_id,month_year' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Strategic memory: mark set_budget as completed
  try { await markActionCompleted(user.id, 'set_budget') } catch { /* ignore */ }

  // Persistent notification
  try {
    const phaseCount = Object.values(phaseBudgets).filter((v: any) => Number(v) > 0).length
    await createNotification({
      userId: user.id,
      type: 'budget_saved',
      title: `Presupuesto de ${monthYear} guardado`,
      body: `${currency === 'USD' ? '$' : currency} ${totalBudget.toLocaleString('es')} distribuido en ${phaseCount || Object.keys(phaseBudgets).length} fases`,
      severity: 'success',
      actionUrl: '/dashboard/budget',
    })
  } catch (e) {
    console.warn('[budget/save] notification failed:', e)
  }

  return NextResponse.json({ ok: true, month_year: monthYear })
}
