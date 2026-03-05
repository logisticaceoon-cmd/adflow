'use client'
// src/app/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', company: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
        data: { full_name: form.full_name, company: form.company },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Ya existe una cuenta con este email. Intentá iniciar sesión.'
        : 'Ocurrió un error. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="card p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="font-display text-2xl font-bold mb-3">Revisá tu email</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Te enviamos un link de confirmación a <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
            Hacé clic en el link para activar tu cuenta.
          </p>
          <Link href="/login" className="btn-ghost justify-center w-full">
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(124,58,237,0.1) 0%, transparent 70%)'
      }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
               style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}>⚡</div>
          <span className="font-display text-2xl font-bold">AdFlow</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Crear cuenta gratis</h1>
          <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
            Empezá a crear campañas profesionales hoy
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre completo</label>
                <input name="full_name" type="text" className="input-field" placeholder="María Rodríguez"
                  value={form.full_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Empresa (opcional)</label>
                <input name="company" type="text" className="input-field" placeholder="Mi Tienda"
                  value={form.company} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="label">Correo electrónico</label>
              <input name="email" type="email" className="input-field" placeholder="tu@empresa.com"
                value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>

            <div>
              <label className="label">Contraseña (mínimo 6 caracteres)</label>
              <input name="password" type="password" className="input-field" placeholder="••••••••"
                value={form.password} onChange={handleChange} required autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />Creando cuenta...</>
              ) : 'Crear cuenta gratis →'}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--muted)' }}>
            Al registrarte aceptás los Términos de Servicio y la Política de Privacidad.
          </p>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
