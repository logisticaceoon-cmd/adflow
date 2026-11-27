// src/lib/email/transactional.ts
// Emails transaccionales de AdFlow (server-only). Centraliza el remitente y el
// layout para no duplicar HTML ni mezclar dominios (usa EMAIL_FROM verificado).
//
// Todas las funciones son "best-effort": logean y devuelven false ante error,
// nunca lanzan, para no romper el flujo que las invoca.
import { Resend } from 'resend'

// Lazy init — avoids crashing build/import when RESEND_API_KEY is missing
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[email] RESEND_API_KEY not set — emails will fail')
    }
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}
const resend = { get emails() { return getResend().emails } }
const FROM = process.env.EMAIL_FROM || 'AdFlow <reportes@adflow.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://adflow.ai'

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14px;margin-top:8px">${cta.label}</a>`
    : ''
  return `
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px">
    <div style="margin-bottom:24px">
      <span style="background:linear-gradient(135deg,#4f6ef7,#7c3aed);padding:6px 12px;border-radius:8px;font-weight:bold;font-size:16px;color:#fff">⚡ AdFlow</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;margin-bottom:12px;color:#fff">${title}</h1>
    <div style="color:#94a3b8;line-height:1.6;font-size:14px">${bodyHtml}</div>
    ${button}
    <p style="font-size:12px;color:#475569;margin-top:28px">AdFlow — Gestión de campañas con IA. Este email es automático.</p>
  </div>`
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (!to) return false
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.error('[email] Resend error:', typeof error === 'string' ? error : (error as any)?.message)
      return false
    }
    return true
  } catch (err: any) {
    console.error('[email] excepción:', err?.message)
    return false
  }
}

/** Email de bienvenida al registrarse. */
export function sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
  const hi = name ? `Hola ${name},` : '¡Hola!'
  return send(
    to,
    '¡Bienvenido a AdFlow! 🚀',
    layout(
      '¡Bienvenido a AdFlow!',
      `<p>${hi}</p>
       <p>Ya podés crear campañas de Facebook Ads con IA en minutos: contanos qué vendés y AdFlow arma la estructura, los públicos y los copies por vos.</p>
       <p>Para empezar con el pie derecho, conectá tu cuenta de Facebook y tu pixel desde Configuración.</p>`,
      { label: 'Ir a mi panel', url: `${APP_URL}/dashboard` },
    ),
  )
}

/** Aviso de créditos: al 80% o al 100% de consumo. */
export function sendCreditsWarningEmail(
  to: string, name: string | undefined, used: number, total: number,
): Promise<boolean> {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  const agotado = used >= total
  const hi = name ? `Hola ${name},` : '¡Hola!'
  return send(
    to,
    agotado ? 'Te quedaste sin créditos en AdFlow' : `Ya usaste el ${pct}% de tus créditos`,
    layout(
      agotado ? 'Créditos agotados' : `Vas por el ${pct}% de tus créditos`,
      `<p>${hi}</p>
       <p>Consumiste <strong>${used} de ${total}</strong> créditos de este período.
       ${agotado
         ? 'Para seguir generando campañas con IA necesitás más créditos.'
         : 'Cuando llegues al 100% no vas a poder generar nuevas campañas hasta el próximo reinicio o hasta mejorar tu plan.'}</p>`,
      { label: 'Ver planes', url: `${APP_URL}/dashboard/settings` },
    ),
  )
}

/** Aviso de token de Facebook expirado (hay que reconectar). */
export function sendMetaTokenExpiredEmail(to: string, name?: string): Promise<boolean> {
  const hi = name ? `Hola ${name},` : '¡Hola!'
  return send(
    to,
    'Reconectá tu cuenta de Facebook en AdFlow',
    layout(
      'Tu conexión con Facebook expiró',
      `<p>${hi}</p>
       <p>No pudimos sincronizar tus métricas ni gestionar tus campañas porque el token de Facebook expiró
       (Meta los renueva cada ~60 días). Mientras tanto, la automatización y los reportes quedan en pausa.</p>
       <p>Reconectá tu cuenta en un clic desde Configuración para retomar todo.</p>`,
      { label: 'Reconectar Facebook', url: `${APP_URL}/dashboard/settings` },
    ),
  )
}
