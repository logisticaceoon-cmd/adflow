// src/app/api/reports/monthly/route.ts
// GET → returns the monthly report for the requested month, generating it
// on-demand if it doesn't exist yet.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMonthlyReport } from '@/lib/monthly-report-engine'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const requestedMonth = searchParams.get('month_year') || undefined
  const monthYear = requestedMonth || new Date().toISOString().slice(0, 7)

  // Try to read the existing snapshot
  const { data: existing } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ report: existing, generated: false })
  }

  // Generate fresh
  try {
    const report = await generateMonthlyReport(user.id, monthYear)
    return NextResponse.json({ report, generated: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'No se pudo generar el reporte' }, { status: 500 })
  }
}
