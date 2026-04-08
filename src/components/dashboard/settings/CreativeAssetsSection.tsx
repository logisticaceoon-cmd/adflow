'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessProfile } from '@/types'

const TONES = [
  { value: 'profesional',   label: '👔 Profesional',    desc: 'Formal, confiable, experto' },
  { value: 'cercano',       label: '😊 Cercano',        desc: 'Cálido, conversacional, humano' },
  { value: 'urgente',       label: '⚡ Urgente',        desc: 'Directo, acción inmediata, FOMO' },
  { value: 'inspiracional', label: '✨ Inspiracional',  desc: 'Aspiracional, emocional, motivador' },
]

interface Props {
  initialData: BusinessProfile | null
}

export default function CreativeAssetsSection({ initialData }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [form, setForm] = useState({
    logo_url:              initialData?.logo_url              || '',
    brand_color_primary:   initialData?.brand_color_primary   || 'var(--ds-color-primary)',
    brand_color_secondary: initialData?.brand_color_secondary || 'var(--ds-color-primary)',
    communication_tone:    initialData?.communication_tone    || 'profesional',
  })

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext  = file.name.split('.').pop()
    const path = `${user!.id}/logo.${ext}`

    const { error } = await supabase.storage
      .from('brand-assets')
      .upload(path, file, { upsert: true })

    if (error) {
      setUploadError(`Error al subir el logo: ${error.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path)
    setForm(p => ({ ...p, logo_url: publicUrl }))
    setUploading(false)
  }

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
      <h2 className="section-title mb-5">🎨 Activos creativos de marca</h2>
      <form onSubmit={save} className="space-y-5">

        {/* Logo */}
        <div>
          <label className="label">Logo del negocio</label>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain"
                   style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-card-border)' }} />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                   style={{ background: 'var(--ds-bg-elevated)', border: '1px dashed var(--ds-card-border)' }}>
                🖼
              </div>
            )}
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-ghost text-sm py-1.5 px-3" disabled={uploading}>
                {uploading ? '⏳ Subiendo...' : form.logo_url ? 'Cambiar logo' : 'Subir logo'}
              </button>
              <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>PNG o SVG, fondo transparente recomendado</p>
              {uploadError && <p className="text-xs mt-1" style={{ color: 'var(--ds-color-danger)' }}>{uploadError}</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Colores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Color primario de marca</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.brand_color_primary}
                onChange={e => setForm(p => ({ ...p, brand_color_primary: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono" style={{ color: 'var(--ds-text-secondary)' }}>{form.brand_color_primary}</span>
            </div>
          </div>
          <div>
            <label className="label">Color secundario de marca</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.brand_color_secondary}
                onChange={e => setForm(p => ({ ...p, brand_color_secondary: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono" style={{ color: 'var(--ds-text-secondary)' }}>{form.brand_color_secondary}</span>
            </div>
          </div>
        </div>

        {/* Tono */}
        <div>
          <label className="label">Tono de comunicación</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {TONES.map(t => (
              <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, communication_tone: t.value }))}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: form.communication_tone === t.value ? 'var(--ds-color-primary-soft)' : 'var(--ds-bg-elevated)',
                  border: `1px solid ${form.communication_tone === t.value ? 'transparent' : 'var(--ds-card-border)'}`,
                }}>
                <p className="text-sm font-semibold mb-0.5">{t.label}</p>
                <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar activos'}
          </button>
        </div>
      </form>
    </div>
  )
}
