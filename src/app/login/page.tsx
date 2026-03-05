'use client'
// src/app/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos. Verificá tus datos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(79,110,247,0.12) 0%, transparent 70%)'
      }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
               style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}>⚡</div>
          <span className="font-display text-2xl font-bold">AdFlow</span>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
            Ingresá a tu cuenta para gestionar tus campañas
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Ingresando...
                </>
              ) : 'Ingresar →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">
              Registrarse gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
