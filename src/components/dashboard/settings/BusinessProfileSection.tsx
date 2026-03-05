'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile } from '@/types'

const INDUSTRIES = [
  { value: 'ecommerce',    label: '🛒 E-commerce / Tienda online' },
  { value: 'servicios',    label: '🔧 Servicios profesionales' },
  { value: 'salud',        label: '🏥 Salud y bienestar' },
  { value: 'educacion',    label: '📚 Educación y cursos' },
  { value: 'inmobiliaria', label: '🏠 Inmobiliaria' },
  { value: 'gastronomia',  label: '🍽 Gastronomía / Restaurantes' },
  { value: 'moda',         label: '👗 Moda y accesorios' },
  { value: 'tecnologia',   label: '💻 Tecnología / SaaS' },
  { value: 'finanzas',     label: '💰 Finanzas y seguros' },
  { value: 'otros',        label: '🌐 Otros' },
]

const COUNTRIES = [
  'Argentina', 'México', 'Colombia', 'Chile', 'Perú', 'Uruguay',
  'Brasil', 'Venezuela', 'Bolivia', 'Ecuador', 'Paraguay', 'España', 'Estados Unidos',
]

const CURRENCIES = ['USD', 'ARS', 'MXN', 'COP', 'CLP', 'PEN', 'UYU', 'BRL', 'EUR']

interface Props {
  initialData: BusinessProfile | null
}

export default function BusinessProfileSection({ initialData }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [form, setForm] = useState({
    business_name:   initialData?.business_name   || '',
    website_url:     initialData?.website_url     || '',
    whatsapp_number: initialData?.whatsapp_number || '',
    industry:        initialData?.industry        || '',
    country:         initialData?.country         || '',
    currency:        initialData?.currency        || 'USD',
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
      <h2 className="section-title mb-5">🏢 Información del negocio</h2>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre del negocio</label>
            <input className="input-field" placeholder="Ej: Mi Tienda Online"
              value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Sitio web / URL principal</label>
            <input className="input-field" type="url" placeholder="https://mitienda.com"
              value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))} />
          </div>
          <div>
            <label className="label">WhatsApp de contacto</label>
            <input className="input-field" placeholder="+54911XXXXXXXX"
              value={form.whatsapp_number} onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))} />
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Con código de país. Ej: +549115551234</p>
          </div>
          <div>
            <label className="label">Industria / Rubro</label>
            <select className="input-field" value={form.industry}
              onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}>
              <option value="">— Seleccioná tu rubro —</option>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">País principal de publicidad</label>
            <select className="input-field" value={form.country}
              onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
              <option value="">— Seleccioná un país —</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Moneda de campañas</label>
            <select className="input-field" value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar información'}
          </button>
        </div>
      </form>
    </div>
  )
}
