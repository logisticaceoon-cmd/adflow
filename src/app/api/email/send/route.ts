// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: to, subject, html' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'AdFlow <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[/api/email/send] Resend error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('[/api/email/send] Error inesperado:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
