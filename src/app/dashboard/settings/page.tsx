'use client'
// src/app/dashboard/settings/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FbAccount } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fbAccounts, setFbAccounts] = useState<FbAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ full_name: '', company: '', report_email: '', report_time: '08:00' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setForm({ full_name: p.full_name || '', company: p.company || '', report_email: p.report_email || user.email || '', report_time: p.report_time || '08:00' })
      }

      const { data: accounts } = await supabase.from('fb_accounts').select('*').eq('user_id', user.id)
      setFbAccounts(accounts || [])
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update(form).eq('id', user!.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function connectFacebook() {
    window.location.href = '/api/auth/facebook'
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title mb-1">Configuración ⚙️</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Gestioná tu cuenta y las integraciones</p>
      </div>

      {/* Facebook connection */}
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-4">📘 Cuenta de Facebook Ads</h2>
        {fbAccounts.length > 0 ? (
          <div className="space-y-3">
            {fbAccounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl"
                   style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.2)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📘</span>
                  <div>
                    <p className="text-sm font-semibold">{acc.account_name || 'Cuenta publicitaria'}</p>
                    <p className="text-xs" style={{ color: 'var(--accent3)' }}>
                      ✅ Conectada · ID: {acc.fb_ad_account_id} · {acc.currency}
                    </p>
                  </div>
                </div>
                <button className="btn-ghost text-xs py-1.5 px-3">Reconectar</button>
              </div>
            ))}
            <button onClick={connectFacebook} className="btn-ghost w-full justify-center text-sm mt-2">
              + Conectar otra cuenta
            </button>
          </div>
        ) : (
          <div>
            <div className="p-5 rounded-xl mb-4 text-center" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="text-3xl mb-2">📘</div>
              <p className="text-sm mb-1 font-medium">Sin cuenta de Facebook conectada</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Conectá tu cuenta para publicar campañas directamente desde AdFlow
              </p>
            </div>
            <button onClick={connectFacebook} className="btn-primary w-full justify-center">
              🔗 Conectar cuenta de Facebook Ads
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
              Se abrirá el login de Facebook. Solo necesitás hacer clic en "Continuar" y elegir tu cuenta publicitaria.
            </p>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-5">👤 Perfil</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo</label>
              <input className="input-field" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Empresa</label>
              <input className="input-field" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* Reports config */}
      <div className="card p-6">
        <h2 className="section-title mb-1">📩 Reportes automáticos diarios</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
          Recibirás un análisis de IA de todas tus campañas cada mañana
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Email para los reportes</label>
            <input type="email" className="input-field" value={form.report_email}
              onChange={e => setForm(p => ({ ...p, report_email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Hora de envío</label>
            <select className="input-field" value={form.report_time} onChange={e => setForm(p => ({ ...p, report_time: e.target.value }))}>
              {['06:00', '07:00', '08:00', '09:00', '10:00'].map(t => (
                <option key={t} value={t}>{t} hs (hora Argentina)</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={saveProfile} className="btn-primary">
          💾 Guardar configuración de reportes
        </button>
      </div>
    </div>
  )
}
