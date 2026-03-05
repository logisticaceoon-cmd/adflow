// src/app/api/email/test/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: 'AdFlow <onboarding@resend.dev>',
    to: 'logisticaceoon@gmail.com',
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
        <div style="background: #1a1f2e; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Enviado desde</p>
          <p style="margin: 4px 0 0; font-weight: 600; color: #4f6ef7;">AdFlow — Gestión de campañas con IA</p>
        </div>
        <p style="font-size: 12px; color: #475569;">
          Este es un email de prueba generado automáticamente. No es necesario responderlo.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[/api/email/test] Resend error:', error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data?.id })
}
