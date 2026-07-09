// src/app/api/email/send/route.ts
// Envío de email genérico. RESTRINGIDO a administradores: antes era un relay
// abierto sin autenticación (cualquiera podía enviar HTML arbitrario a cualquier
// destinatario vía Resend → spam/phishing). Ahora exige sesión + rol admin +
// rate limit + validación de payload.
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, emailSendSchema } from '@/lib/validations'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'AdFlow <reportes@adflow.ai>'

export async function POST(req: NextRequest) {
  try {
    // 1) Autenticación
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // 2) Autorización: solo administradores
    const db = createAdminClient()
    const { data: profile } = await db
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // 3) Rate limit
    const rl = await checkRateLimit(user.id, 'email')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intentá de nuevo en unos minutos.', retryAfter: rl.retryAfter },
        { status: 429 },
      )
    }

    // 4) Validación de payload
    const body = await req.json().catch(() => ({}))
    const parsed = validate(emailSendSchema, body)
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { to, subject, html } = parsed.data

    // 5) Envío
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('[/api/email/send] Resend error:', error)
      return NextResponse.json({ success: false, error: 'No se pudo enviar el email' }, { status: 502 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('[/api/email/send] Error inesperado:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
