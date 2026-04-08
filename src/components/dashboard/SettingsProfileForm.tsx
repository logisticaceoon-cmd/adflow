'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
  userEmail: string
}

export default function SettingsProfileForm({ profile, userEmail }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    company: profile?.company || '',
    report_email: profile?.report_email || userEmail,
    report_time: profile?.report_time || '08:00',
  })

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

  return (
    <>
      {/* Profile */}
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-5">👤 Perfil</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo</label>
              <input className="input-field" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Empresa</label>
              <input className="input-field" value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Opcional" />
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
        <p className="text-xs mb-5" style={{ color: 'var(--ds-text-secondary)' }}>
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
            <select className="input-field" value={form.report_time}
              onChange={e => setForm(p => ({ ...p, report_time: e.target.value }))}>
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
    </>
  )
}
