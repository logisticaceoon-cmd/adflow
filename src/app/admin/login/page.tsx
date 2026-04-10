'use client'
// src/app/admin/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Zap } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 1. Autenticar
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError || !signInData?.user) {
        setError('Credenciales inválidas. Verificá los datos.')
        setLoading(false)
        return
      }

      // 2. Verificar role en el servidor (usa service role key, bypasea RLS)
      const res = await fetch('/api/admin/verify-role')
      const json = await res.json()
      const role: string = json.role ?? 'user'

      if (!['admin', 'super_admin'].includes(role)) {
        await supabase.auth.signOut()
        setError(
          json.error === 'profile_not_found'
            ? 'No se encontró el perfil del usuario. Contactá al soporte.'
            : `Acceso denegado. Tu rol actual es "${role}". Solo admins pueden ingresar.`
        )
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0a0408' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(234,27,126,0.10) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #2dd4a8, #c5006a)' }}>
            <Shield size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <span className="font-display text-xl font-bold block leading-none">AdFlow</span>
            <span className="text-[10px] font-bold tracking-widest uppercase block"
                  style={{ color: '#2dd4a8' }}>Admin Panel</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
             style={{ background: 'rgba(18,4,10,0.97)', border: '1px solid rgba(98,196,176,0.16)' }}>
          <h1 className="font-display text-xl font-bold mb-1">Acceso administrador</h1>
          <p className="text-sm mb-6" style={{ color: '#8892b0' }}>
            Área restringida · Solo personal autorizado
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@adflow.ai"
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: loading ? 'rgba(233,30,140,0.5)' : 'linear-gradient(135deg, #2dd4a8, #c5006a)',
                color: '#fff',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Ingresar al panel
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#8892b0' }}>
          ¿Sos usuario? <a href="/login" style={{ color: '#8892b0' }} className="hover:underline">Ir al login de usuarios</a>
        </p>
      </div>
    </div>
  )
}
