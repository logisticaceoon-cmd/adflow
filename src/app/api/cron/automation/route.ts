// src/app/api/cron/automation/route.ts
// Cron de automatización (vercel.json: "0 */3 * * *" — cada 3 horas).
//
// Sincroniza métricas y evalúa las reglas de automatización con más frecuencia
// que el reporte diario. NO envía emails ni genera el reporte con IA (eso sigue
// en /api/cron/daily-report, 1×/día) para no spamear ni disparar costos de IA.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { syncUserMetrics } from '@/lib/meta-sync-engine'
import { evaluateAutomationRules } from '@/lib/automation-engine'

// Margen para procesar varios usuarios de forma secuencial (respeta rate limits de Meta).
export const maxDuration = 60

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createAdminClient()

  // Usuarios con al menos una campaña publicada (meta_campaign_id no nulo)
  const { data: rows } = await db
    .from('campaigns')
    .select('user_id')
    .not('meta_campaign_id', 'is', null)

  const userIds = [...new Set<string>((rows ?? []).map((r: { user_id: string }) => r.user_id))]

  if (userIds.length === 0) {
    return NextResponse.json({ processed: 0, summary: [] })
  }

  // Procesamiento secuencial: evita saturar la Meta API y el runtime serverless.
  // NOTA de escala: con cientos de usuarios conviene mover esto a una cola
  // (QStash / waitUntil) y procesar en lotes con límite de concurrencia.
  const summary: Array<Record<string, unknown>> = []
  for (const userId of userIds) {
    try {
      const sync = await syncUserMetrics(userId, 'last_7d')
      const autom = await evaluateAutomationRules(userId)
      summary.push({
        userId,
        sync: sync.status,
        campaignsSynced: sync.campaignsSynced,
        rulesTriggered: autom.triggered,
        executed: autom.executed,
        pending: autom.pending,
      })
    } catch (err: any) {
      summary.push({ userId, error: err?.message || String(err) })
    }
  }

  return NextResponse.json({ processed: userIds.length, summary })
}
