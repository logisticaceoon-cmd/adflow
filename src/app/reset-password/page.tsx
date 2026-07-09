'use client'
// src/app/reset-password/page.tsx
// Página donde el usuario define su nueva contraseña. Se llega aquí desde el
// enlace del email, tras pasar por /auth/callback que establece la sesión de
// recuperación. Aquí solo se llama a updateUser({ password }).
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Verificar que exista sesión de recuperación (si no, el enlace expiró)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña. Pedí un nuevo enlace.')
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16, textAlign: 'center' }}>
            Nueva contraseña
          </h1>

          {done ? (
            <p style={{ color: 'var(--ds-color-success)', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>
              ✓ Contraseña actualizada. Redirigiéndote al panel…
            </p>
          ) : hasSession === false ? (
            <>
              <p style={{ color: '#9a9ab0', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                El enlace no es válido o expiró. Pedí uno nuevo.
              </p>
              <Link href="/forgot-password" style={{ display: 'block', textAlign: 'center', color: 'var(--ds-color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Solicitar nuevo enlace
              </Link>
            </>
          ) : (
            <>
              {error && (
                <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nueva contraseña</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="new-password" minLength={8} style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirmar contraseña</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" required autoComplete="new-password" minLength={8} style={inputStyle}
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
                  {loading ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
