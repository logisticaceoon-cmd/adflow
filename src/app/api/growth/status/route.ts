// src/app/api/growth/status/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateGrowthStatus } from '@/lib/growth-engine'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: pa } = await supabase
    .from('pixel_analysis')
    .select('events_data, level, level_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pa) {
    return NextResponse.json({
      growth: calculateGrowthStatus({}, 0, 0, 'Sin Data'),
    })
  }

  // Try to read previous month purchases from the level history snapshots if any.
  // Falling back to 0 (which yields a 0% growth rate) is fine for a first pass.
  const previousMonthPurchases = 0

  const growth = calculateGrowthStatus(
    pa.events_data,
    previousMonthPurchases,
    pa.level ?? 0,
    pa.level_name ?? 'Sin Data',
  )
  return NextResponse.json({ growth })
}
