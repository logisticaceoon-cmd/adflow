// src/app/api/email/test/route.ts
// Health-check de la integración con Resend. RESTRINGIDO a administradores:
// antes era GET público sin auth (agotamiento de cuota / spam a una casilla fija).
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'AdFlow <reportes@adflow.ai>'

export async function GET() {
  // Autenticación + rol admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles').select('role, report_email').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const to = (profile as any).report_email || user.email
  if (!to) return NextResponse.json({ error: 'Sin email de destino' }, { status: 400 })

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'AdFlow - Test de email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f1117; color: #e2e8f0; border-radius: 12px;">
        <div style="margin-bottom: 24px;">
          <span style="background: linear-gradient(135deg, #4f6ef7, #7c3aed); padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 16px; color: #fff;">
            ⚡ AdFlow
          </span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #fff;">
          Test de email funcionando ✅
        </h1>
        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Si estás viendo este email, la integración con Resend está configurada correctamente en AdFlow.
        </p>
        <p style="font-size: 12px; color: #475569;">
          Email de prueba generado automáticamente. No es necesario responderlo.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[/api/email/test] Resend error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo enviar el email de prueba' }, { status: 502 })
  }

  return NextResponse.json({ success: true, id: data?.id })
}
