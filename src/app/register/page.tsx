'use client'
// src/app/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <g fill="none" fillRule="evenodd">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </g>
  </svg>
)

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#9a9ab0',
  marginBottom: 6,
  letterSpacing: '0.02em',
}

export default function RegisterPage() {
  const [form, setForm]         = useState({ full_name: '', email: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Ya existe una cuenta con este email. Intentá iniciar sesión.'
          : 'Ocurrió un error. Intentá de nuevo.'
      )
      setLoading(false)
      return
    }
    setSuccess(true)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Error al conectar con Google. Intentá de nuevo.')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #080b14 0%, #0d0820 50%, #080b14 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'fixed', top: '-12%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.26) 0%, transparent 68%)', filter: 'blur(88px)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,196,176,0.20) 0%, transparent 68%)', filter: 'blur(88px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{
            background: 'linear-gradient(160deg, rgba(16,10,28,0.92) 0%, rgba(8,8,18,0.96) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, padding: '2.5rem', maxWidth: 400, width: '100%', textAlign: 'center',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 24px 72px rgba(0,0,0,0.55), 0 0 60px rgba(233,30,140,0.08)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(233,30,140,0.55), rgba(98,196,176,0.35), transparent)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 44, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Revisá tu email</h2>
            <p style={{ color: '#7a7a9a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Te enviamos un link de confirmación a{' '}
              <strong style={{ color: 'var(--ds-color-primary)' }}>{form.email}</strong>.
              Hacé clic en el link para activar tu cuenta.
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #080b14 0%, #0d0820 50%, #080b14 100%)',
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs — matching login */}
      <div style={{ position: 'fixed', top: '-12%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.26) 0%, transparent 68%)', filter: 'blur(88px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,196,176,0.20) 0%, transparent 68%)', filter: 'blur(88px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '42%', left: '40%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,30,140,0.12) 0%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      {/* Grid overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)', backgroundSize: '72px 72px', maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400 }}>
        {/* Logo — matching login */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 32px rgba(233,30,140,0.55), 0 0 64px rgba(233,30,140,0.20)' }}>⚡</div>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.5px', textShadow: '0 0 20px rgba(255,255,255,0.12)' }}>AdFlow</span>
        </div>

        {/* Card — matching login style */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(16,10,28,0.92) 0%, rgba(8,8,18,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22, padding: '2rem',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 24px 72px rgba(0,0,0,0.55), 0 0 60px rgba(233,30,140,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top glow line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(233,30,140,0.55), rgba(98,196,176,0.35), transparent)', pointerEvents: 'none' }} />
          {/* Top gloss */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)', pointerEvents: 'none', borderRadius: 'inherit' }} />

          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4, textAlign: 'center' }}>
            Crear cuenta gratis
          </h1>
          <p style={{ color: '#7a7a9a', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--ds-color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Iniciá sesión
            </Link>
          </p>

          {error && (
            <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Register form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                name="full_name" type="text" value={form.full_name} onChange={handleChange}
                placeholder="María Rodríguez" required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.6)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="tu@email.com" required autoComplete="email"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.6)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Contraseña (mín. 6 caracteres)</label>
              <input
                name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" required autoComplete="new-password"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.6)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none', minHeight: 44,
                background: loading ? 'rgba(233,30,140,0.6)' : 'linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary))',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 0 32px rgba(233,30,140,0.50), 0 0 64px rgba(233,30,140,0.18)',
                transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(233,30,140,0.70), 0 0 96px rgba(233,30,140,0.25)' } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(233,30,140,0.50), 0 0 64px rgba(233,30,140,0.18)' }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />Creando cuenta...</>
              ) : 'Crear cuenta gratis →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#8892b0', fontSize: 12 }}>o registrate con</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle} disabled={googleLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 20px', borderRadius: 10, minHeight: 44,
              background: '#fff', border: 'none',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.7 : 1,
              fontSize: 14, fontWeight: 600, color: '#1f1f1f',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {googleLoading ? (
              <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#1f1f1f', animation: 'spin 0.7s linear infinite' }} />Conectando...</>
            ) : (
              <><GoogleIcon />Registrarse con Google</>
            )}
          </button>
        </div>

        <p style={{ color: '#8892b0', fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Al continuar aceptás nuestros{' '}
          <Link href="/terms" style={{ color: '#8892b0', textDecoration: 'none' }}>Términos de Servicio</Link>
          {' '}y{' '}
          <Link href="/privacy" style={{ color: '#8892b0', textDecoration: 'none' }}>Política de Privacidad</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
