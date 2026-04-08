// src/app/api/cron/daily-report/route.ts
// Cron job que se ejecuta automáticamente cada mañana
// En Vercel: configurar en vercel.json como cron: "0 11 * * *" (8 AM Argentina = 11 UTC)

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzePixel, savePixelAnalysis } from '@/lib/pixel-analyzer'
import { generateMonthlyReport } from '@/lib/monthly-report-engine'
import { syncUserMetrics } from '@/lib/meta-sync-engine'
import { evaluateAchievements } from '@/lib/achievement-engine'
import { evaluateAutomationRules, createDefaultRules } from '@/lib/automation-engine'
import type { Campaign, CampaignMetrics, Recommendation } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

// Verificación de seguridad: solo Vercel puede llamar a este endpoint
function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Obtener todos los usuarios con campañas activas y reportes habilitados
  const { data: usersWithCampaigns } = await supabase
    .from('campaigns')
    .select('user_id')
    .eq('status', 'active')

  const uniqueUserIds: string[] = [...new Set<string>(usersWithCampaigns?.map((c: { user_id: string }) => c.user_id) ?? [])]

  const results = []

  for (const userId of uniqueUserIds) {
    try {
      await processUserReport(supabase, userId)
      results.push({ userId, status: 'ok' })
    } catch (err) {
      console.error(`Error procesando usuario ${userId}:`, err)
      results.push({ userId, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

async function processUserReport(supabase: any, userId: string) {
  // 1. Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile?.report_active || !profile?.report_email) return

  // 2. Obtener campañas activas del usuario
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!campaigns?.length) return

  // 3. Obtener token de Facebook del usuario
  const { data: fbConn } = await supabase
    .from('facebook_connections')
    .select('access_token')
    .eq('user_id', userId)
    .maybeSingle()

  const fbToken = fbConn?.access_token
  if (!fbToken) return

  // 3.0 Sincronizar métricas diarias desde Meta Ads API
  try {
    const syncResult = await syncUserMetrics(userId, 'last_7d')
    console.log(`[cron] sync ${userId}: ${syncResult.status} (${syncResult.campaignsSynced} campaigns, ${syncResult.adsetsSynced} adsets, ${syncResult.errors.length} errors)`)
  } catch (err) {
    console.warn(`[cron] meta sync failed for ${userId}:`, err)
  }

  // 3.1 Evaluar logros persistentes después del sync
  try {
    const newAchievements = await evaluateAchievements(userId)
    if (newAchievements.length > 0) {
      console.log(`[cron] User ${userId} unlocked ${newAchievements.length} achievements:`, newAchievements.map(a => a.code))
    }
  } catch (err) {
    console.warn(`[cron] achievement evaluation failed for ${userId}:`, err)
  }

  // 3.2 Crear reglas default la primera vez + evaluar automation rules
  try {
    const createdRules = await createDefaultRules(userId)
    if (createdRules > 0) {
      console.log(`[cron] User ${userId}: seeded ${createdRules} default automation rules`)
    }
    const autoResult = await evaluateAutomationRules(userId)
    if (autoResult.triggered > 0) {
      console.log(`[cron] Automation for ${userId}: ${autoResult.rulesEvaluated} evaluated, ${autoResult.triggered} triggered, ${autoResult.executed} executed, ${autoResult.pending} pending, ${autoResult.failed} failed`)
    }
  } catch (err) {
    console.warn(`[cron] automation evaluation failed for ${userId}:`, err)
  }

  // 3.5 Refrescar pixel analysis (siempre, así las recomendaciones están al día)
  try {
    const { data: biz } = await supabase
      .from('business_profiles')
      .select('pixel_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (biz?.pixel_id) {
      const analysis = await analyzePixel(biz.pixel_id, fbToken)
      await savePixelAnalysis(userId, analysis)
    }
  } catch (err) {
    console.warn(`[cron] pixel refresh failed for ${userId}:`, err)
  }

  // 3.6 Si es el primer día del mes, generar el reporte mensual del mes anterior
  if (new Date().getDate() === 1) {
    try {
      const prev = new Date()
      prev.setMonth(prev.getMonth() - 1)
      const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      await generateMonthlyReport(userId, prevMonth)
    } catch (err) {
      console.warn(`[cron] monthly report failed for ${userId}:`, err)
    }
  }

  // 4. Obtener métricas de Facebook para cada campaña
  const metricsSnapshot: Record<string, CampaignMetrics> = {}

  for (const campaign of campaigns) {
    if (campaign.meta_campaign_id && fbToken) {
      const metrics = await fetchFBMetrics(
        campaign.meta_campaign_id,
        fbToken
      )
      metricsSnapshot[campaign.id] = metrics

      // Actualizar métricas en la BD
      await supabase
        .from('campaigns')
        .update({ metrics, updated_at: new Date().toISOString() })
        .eq('id', campaign.id)
    }
  }

  // 4. Generar análisis con Claude IA
  const { analysis, recommendations } = await generateAIAnalysis(campaigns, metricsSnapshot)

  // 5. Guardar reporte en Supabase
  const today = new Date().toISOString().split('T')[0]
  const { data: report } = await supabase
    .from('daily_reports')
    .upsert({
      user_id: userId,
      report_date: today,
      metrics_snapshot: metricsSnapshot,
      ai_analysis: analysis,
      recommendations,
      email_status: 'pending',
    }, { onConflict: 'user_id,report_date' })
    .select()
    .single()

  // 6. Enviar email con el reporte
  await sendReportEmail(profile, campaigns, metricsSnapshot, analysis, recommendations, report?.id)

  // 7. Marcar email como enviado
  await supabase
    .from('daily_reports')
    .update({ email_sent_at: new Date().toISOString(), email_status: 'sent' })
    .eq('user_id', userId)
    .eq('report_date', today)
}

async function fetchFBMetrics(campaignId: string, accessToken: string): Promise<CampaignMetrics> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const fields = 'spend,impressions,clicks,ctr,cpm,cpc,actions,action_values,reach,frequency'
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${campaignId}/insights?` +
      `fields=${fields}&date_preset=last_7d&access_token=${accessToken}`
    )
    const data = await res.json()
    const insight = data.data?.[0]
    if (!insight) return {}

    const conversions = insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
    const revenue = insight.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0

    return {
      spend: parseFloat(insight.spend || 0),
      impressions: parseInt(insight.impressions || 0),
      clicks: parseInt(insight.clicks || 0),
      ctr: parseFloat(insight.ctr || 0),
      cpm: parseFloat(insight.cpm || 0),
      cpc: parseFloat(insight.cpc || 0),
      conversions: parseInt(conversions),
      roas: insight.spend > 0 ? parseFloat(revenue) / parseFloat(insight.spend) : 0,
      cpa: conversions > 0 ? parseFloat(insight.spend) / parseInt(conversions) : 0,
      reach: parseInt(insight.reach || 0),
      frequency: parseFloat(insight.frequency || 0),
      updated_at: new Date().toISOString(),
    }
  } catch {
    return {}
  }
}

async function generateAIAnalysis(campaigns: Campaign[], metrics: Record<string, CampaignMetrics>) {
  const campaignSummary = campaigns.map(c => ({
    name: c.name,
    objective: c.objective,
    daily_budget: c.daily_budget,
    metrics: metrics[c.id] || {},
  }))

  const prompt = `Eres un experto en Facebook Ads con 10 años de experiencia optimizando campañas para negocios LATAM.

Analizá el rendimiento de estas campañas y generá recomendaciones accionables:

${JSON.stringify(campaignSummary, null, 2)}

CRITERIOS DE ANÁLISIS:
- ROAS excelente: ≥ 4x | Bueno: 2-4x | Malo: < 2x
- CTR excelente: ≥ 3% | Bueno: 1-3% | Malo: < 1%
- Frecuencia alta (saturación): > 3.5
- CPA: comparar con el valor promedio del producto

Respondé ÚNICAMENTE con JSON válido, sin texto extra, sin backticks:

{
  "analysis": "Resumen ejecutivo en 2-3 oraciones del estado general de las campañas. Directo y útil.",
  "recommendations": [
    {
      "campaign_id": "id_de_la_campaña_en_el_array",
      "campaign_name": "nombre de la campaña",
      "type": "scale_up|scale_down|pause|refresh_creative|maintain|duplicate",
      "priority": "high|medium|low",
      "title": "Título corto de la recomendación",
      "description": "Descripción específica con números: qué hacer exactamente y por qué",
      "action": {
        "label": "Texto del botón de acción",
        "new_budget": 150
      }
    }
  ]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
  const parsed = JSON.parse(clean)

  return {
    analysis: parsed.analysis || '',
    recommendations: parsed.recommendations || [],
  }
}

async function sendReportEmail(
  profile: any, campaigns: Campaign[],
  metrics: Record<string, CampaignMetrics>,
  analysis: string, recommendations: Recommendation[],
  reportId: string
) {
  const totalSpend = Object.values(metrics).reduce((s, m) => s + (m.spend || 0), 0)
  const avgRoas = Object.values(metrics).filter(m => m.roas).reduce((s, m, _, a) => s + (m.roas || 0) / a.length, 0)
  const highPriority = recommendations.filter(r => r.priority === 'high')

  const TYPE_ICONS: Record<string, string> = {
    scale_up: '📈', scale_down: '⚠️', pause: '🛑',
    refresh_creative: '🔄', maintain: '✅', duplicate: '✨'
  }

  const campaignRows = campaigns.map(c => {
    const m = metrics[c.id] || {}
    const roasColor = (m.roas || 0) >= 4 ? '#06d6a0' : (m.roas || 0) >= 2 ? '#f59e0b' : '#ef4444'
    return `
      <tr style="border-bottom: 1px solid #1e2035;">
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${c.name}</td>
        <td style="padding: 12px 16px; font-size: 13px; color: #9ca3af;">$${(m.spend || 0).toFixed(0)}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: ${roasColor};">${m.roas ? m.roas.toFixed(1) + 'x' : '—'}</td>
        <td style="padding: 12px 16px; font-size: 13px; color: #9ca3af;">${m.conversions || '—'}</td>
      </tr>`
  }).join('')

  const recCards = recommendations.slice(0, 4).map(r => `
    <div style="background: #0e1020; border: 1px solid #1e2035; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <p style="font-size: 12px; font-weight: 700; color: #4f6ef7; margin: 0 0 6px;">${TYPE_ICONS[r.type] || '→'} ${r.title}</p>
      <p style="font-size: 12px; color: #6b7280; margin: 0;">${r.description}</p>
    </div>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Reporte AdFlow</title></head>
<body style="background: #07080f; color: #e8eaf0; font-family: 'DM Sans', -apple-system, sans-serif; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #4f6ef7, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">⚡</div>
      <span style="font-size: 22px; font-weight: 800;">AdFlow</span>
      <span style="color: #6b7280; margin-left: auto; font-size: 13px;">
        ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </span>
    </div>

    <!-- Summary -->
    <div style="background: linear-gradient(135deg, rgba(79,110,247,0.12), rgba(124,58,237,0.12)); border: 1px solid rgba(79,110,247,0.2); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 16px; font-weight: 700; margin: 0 0 8px;">📊 Resumen del día</p>
      <p style="font-size: 13px; color: #9ca3af; margin: 0;">${analysis}</p>
    </div>

    <!-- Metrics -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background: #0e1020; border: 1px solid #1e2035; border-top: 2px solid #4f6ef7; border-radius: 12px; padding: 16px;">
        <p style="font-size: 11px; color: #6b7280; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">Gasto total</p>
        <p style="font-size: 24px; font-weight: 800; margin: 0;">$${totalSpend.toFixed(0)}</p>
      </div>
      <div style="background: #0e1020; border: 1px solid #1e2035; border-top: 2px solid #06d6a0; border-radius: 12px; padding: 16px;">
        <p style="font-size: 11px; color: #6b7280; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">ROAS promedio</p>
        <p style="font-size: 24px; font-weight: 800; margin: 0;">${avgRoas.toFixed(1)}x</p>
      </div>
      <div style="background: #0e1020; border: 1px solid #1e2035; border-top: 2px solid #7c3aed; border-radius: 12px; padding: 16px;">
        <p style="font-size: 11px; color: #6b7280; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">Alertas IA</p>
        <p style="font-size: 24px; font-weight: 800; margin: 0;">${highPriority.length}</p>
      </div>
    </div>

    <!-- Campaigns table -->
    <div style="background: #0e1020; border: 1px solid #1e2035; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
      <div style="padding: 16px 16px 0; border-bottom: 1px solid #1e2035; margin-bottom: 0;">
        <p style="font-weight: 700; font-size: 14px; margin: 0 0 16px;">Campañas activas</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: rgba(255,255,255,0.02);">
            <th style="text-align: left; padding: 10px 16px; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Campaña</th>
            <th style="text-align: left; padding: 10px 16px; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Gasto</th>
            <th style="text-align: left; padding: 10px 16px; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">ROAS</th>
            <th style="text-align: left; padding: 10px 16px; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Conversiones</th>
          </tr>
        </thead>
        <tbody>${campaignRows}</tbody>
      </table>
    </div>

    <!-- Recommendations -->
    ${recommendations.length ? `
    <p style="font-weight: 700; font-size: 14px; margin: 0 0 12px;">🤖 Recomendaciones IA de hoy</p>
    ${recCards}` : ''}

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports"
         style="display: inline-block; background: linear-gradient(135deg, #4f6ef7, #7c3aed); color: white; text-decoration: none; padding: 13px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">
        Ver reporte completo →
      </a>
    </div>

    <p style="text-align: center; font-size: 11px; color: #374151; margin-top: 32px;">
      AdFlow · Enviado automáticamente a ${profile.report_email}<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #4f6ef7;">Configurar reportes</a>
    </p>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: 'AdFlow <reportes@adflow.ai>',
    to: profile.report_email,
    subject: `📊 Reporte AdFlow — ${campaigns.length} campaña${campaigns.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`,
    html,
  })
}
