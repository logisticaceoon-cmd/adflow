'use client'
// src/app/forgot-password/page.tsx
// Solicitud de recuperación de contraseña. Envía un email con enlace de reseteo
// vía Supabase Auth (resetPasswordForEmail). El enlace vuelve a /auth/callback
// que intercambia el código y redirige a /reset-password.
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#9a9ab0', marginBottom: 6,
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (err) throw err
      // Siempre mostramos éxito (no revelar si el email existe o no)
      setSent(true)
    } catch {
      // Por privacidad, mostramos el mismo mensaje de éxito ante errores comunes
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #080b14 0%, #0d0820 50%, #080b14 100%)',
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--ds-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#f0f0ff' }}>AdFlow</span>
        </div>

        <div style={{
          background: 'linear-gradient(160deg, rgba(16,10,28,0.92) 0%, rgba(8,8,18,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '2rem',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
            Recuperar contraseña
          </h1>

          {sent ? (
            <>
              <p style={{ color: '#9a9ab0', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
                Revisá tu bandeja de entrada y spam.
              </p>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', color: 'var(--ds-color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Volver a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <p style={{ color: '#7a7a9a', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>
              {error && (
                <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoComplete="email" style={inputStyle}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none', minHeight: 44,
                    background: loading ? 'rgba(233,30,140,0.6)' : 'var(--ds-color-primary)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
              <p style={{ color: '#7a7a9a', fontSize: 13, textAlign: 'center', marginTop: 18 }}>
                <Link href="/login" style={{ color: '#9a9ab0', textDecoration: 'none' }}>Volver a iniciar sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
