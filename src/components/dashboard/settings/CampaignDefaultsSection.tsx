'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile } from '@/types'

const OBJECTIVES = [
  { value: 'CONVERSIONS',     label: '🛒 Ventas / Conversiones' },
  { value: 'TRAFFIC',         label: '🖱 Tráfico al sitio web' },
  { value: 'REACH',           label: '👁 Reconocimiento de marca' },
  { value: 'LEAD_GENERATION', label: '📩 Generación de leads' },
]

interface Props {
  initialData: BusinessProfile | null
}

export default function CampaignDefaultsSection({ initialData }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [form, setForm] = useState({
    default_daily_budget: initialData?.default_daily_budget ?? 50,
    default_objective:    initialData?.default_objective    || 'CONVERSIONS',
    default_whatsapp_cta: initialData?.default_whatsapp_cta || '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('business_profiles').upsert(
      { user_id: user!.id, ...form, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="card p-6 mb-5">
      <h2 className="section-title mb-1">⚙️ Configuración de campañas</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
        Estos valores se usan como punto de partida al crear nuevas campañas
      </p>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Presupuesto diario por defecto (USD)</label>
            <input className="input-field" type="number" min="1" placeholder="50"
              value={form.default_daily_budget}
              onChange={e => setForm(p => ({ ...p, default_daily_budget: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Objetivo principal por defecto</label>
            <select className="input-field" value={form.default_objective}
              onChange={e => setForm(p => ({ ...p, default_objective: e.target.value }))}>
              {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">URL de WhatsApp para CTAs</label>
            <input className="input-field" placeholder="https://wa.me/5491155551234"
              value={form.default_whatsapp_cta}
              onChange={e => setForm(p => ({ ...p, default_whatsapp_cta: e.target.value }))} />
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Formato: https://wa.me/[código_país][número]. Ej: https://wa.me/5491155551234
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
