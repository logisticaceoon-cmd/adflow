// src/app/api/cron/daily-report/route.ts
// Cron trigger (vercel.json: "0 11 * * *") — fans out to process-user-report for each user

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Obtener usuarios únicos con campañas activas
  const { data: usersWithCampaigns } = await supabase
    .from('campaigns')
    .select('user_id')
    .eq('status', 'active')

  const uniqueUserIds: string[] = [
    ...new Set<string>(usersWithCampaigns?.map((c: { user_id: string }) => c.user_id) ?? [])
  ]

  if (uniqueUserIds.length === 0) {
    return NextResponse.json({ dispatched: 0, users: [] })
  }

  // Fan-out: llamar a process-user-report para cada usuario en paralelo
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const results = await Promise.allSettled(
    uniqueUserIds.map(userId =>
      fetch(`${baseUrl}/api/cron/process-user-report?userId=${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
      })
    )
  )

  const summary = uniqueUserIds.map((userId, i) => {
    const result = results[i]
    return {
      userId,
      status: result.status === 'fulfilled' ? result.value.status : 'dispatch_error',
      ...(result.status === 'rejected' && { error: String(result.reason) }),
    }
  })

  return NextResponse.json({ dispatched: uniqueUserIds.length, summary })
}
