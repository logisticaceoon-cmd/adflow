'use client'
// src/app/dashboard/create/page.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AICopies, CampaignObjective, CreateCampaignForm } from '@/types'

const OBJECTIVES = [
  { value: 'CONVERSIONS',      label: '🛒 Ventas / Conversiones', desc: 'Optimiza para que la gente compre en tu sitio' },
  { value: 'TRAFFIC',          label: '🖱 Tráfico al sitio web',  desc: 'Atrae visitantes a tu web o landing page' },
  { value: 'REACH',            label: '👁 Reconocimiento de marca', desc: 'Muestra tu marca al mayor número de personas' },
  { value: 'LEAD_GENERATION',  label: '📩 Generación de leads',    desc: 'Captura emails y datos de potenciales clientes' },
]

const STEPS = ['Objetivo', 'Contenido', 'Revisión IA', 'Publicar']

export default function CreateCampaignPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [genStep, setGenStep] = useState(-1)
  const [error, setError] = useState('')
  const [aiCopies, setAiCopies] = useState<AICopies | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedHeadline, setSelectedHeadline] = useState(0)

  const [form, setForm] = useState<CreateCampaignForm>({
    name: '',
    objective: 'CONVERSIONS',
    daily_budget: 50,
    product_description: '',
    product_url: '',
    target_audience: '',
  })

  function setField(field: keyof CreateCampaignForm, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  // PASO 1 → 2: validar objetivo y nombre
  function goToContent() {
    if (!form.name.trim()) { setError('Escribí el nombre de la campaña.'); return }
    if (!form.objective) { setError('Seleccioná un objetivo.'); return }
    setError('')
    setStep(1)
  }

  // PASO 2 → 3: generar copies con Claude IA
  async function generateWithAI() {
    if (!form.product_description.trim()) {
      setError('Describí tu producto o servicio para que la IA pueda crear los textos.')
      return
    }
    setError('')
    setLoading(true)
    setStep(2)
    setGenStep(0)

    try {
      // Animación de pasos de generación
      const steps = [
        () => setGenStep(0), // Analizando
        () => setGenStep(1), // Generando copies
        () => setGenStep(2), // Definiendo audiencias
        () => setGenStep(3), // Finalizando
      ]

      steps[0]()
      const timer1 = setTimeout(() => steps[1](), 1200)
      const timer2 = setTimeout(() => steps[2](), 2400)

      // Llamada real a la API de generación IA
      const res = await fetch('/api/ai/generate-copies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          objective: form.objective,
          daily_budget: form.daily_budget,
          product_description: form.product_description,
          product_url: form.product_url,
          target_audience: form.target_audience,
        })
      })

      clearTimeout(timer1)
      clearTimeout(timer2)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar copies')
      setGenStep(3)
      setTimeout(() => {
        setAiCopies(data.copies)
        setGenStep(-1)
        setLoading(false)
      }, 600)

    } catch (err: any) {
      setError(err.message || 'Error desconocido al conectar con la IA')
      setLoading(false)
      setStep(1)
      setGenStep(-1)
    }
  }

  // PASO 3 → publicar: guardar borrador en Supabase
  async function saveCampaign() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: campaign, error: err } = await supabase
      .from('campaigns')
      .insert({
        user_id: user!.id,
        name: form.name,
        objective: form.objective,
        daily_budget: form.daily_budget,
        product_description: form.product_description,
        product_url: form.product_url,
        target_audience: form.target_audience,
        status: 'draft',
        ai_copies: aiCopies ? { ...aiCopies, headlines: [aiCopies.headlines[selectedHeadline], ...aiCopies.headlines.filter((_,i) => i !== selectedHeadline)] } : null,
      })
      .select()
      .single()

    if (err || !campaign) {
      setError('Error al guardar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // Subir archivos creativos si los hay
    if (uploadedFiles.length > 0) {
      const uploadErrors: string[] = []
      for (const file of uploadedFiles) {
        const path = `${user!.id}/${campaign.id}/${file.name}`
        const { error: uploadError } = await supabase.storage.from('creatives').upload(path, file)
        if (uploadError) {
          console.error(`Error subiendo ${file.name}:`, uploadError.message)
          uploadErrors.push(file.name)
        }
      }
      if (uploadErrors.length > 0) {
        setError(`La campaña se guardó, pero falló la subida de: ${uploadErrors.join(', ')}. Podés subirlos desde la página de la campaña.`)
      }
    }

    setStep(3)
    setLoading(false)
  }

  const GEN_STEPS = [
    '🧠 Analizando tu producto y mercado...',
    '✍️ Generando headlines y copies...',
    '🎯 Definiendo audiencias óptimas...',
    '✅ ¡Copies listos!',
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title mb-1">Crear campaña con IA ✨</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Completá los datos y la IA genera todo automáticamente
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                   style={{
                     background: i < step ? 'var(--accent3)' : i === step ? 'linear-gradient(135deg,#4f6ef7,#7c3aed)' : 'transparent',
                     border: i < step ? 'none' : i === step ? 'none' : '2px solid var(--border)',
                     color: i <= step ? '#fff' : 'var(--muted)',
                     boxShadow: i === step ? '0 0 20px rgba(79,110,247,0.4)' : 'none',
                   }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs" style={{ color: i === step ? 'var(--text)' : 'var(--muted)', fontWeight: i === step ? 500 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-px" style={{ background: i < step ? 'var(--accent3)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* ── STEP 0: Objetivo ── */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title mb-5">📋 Datos de la campaña</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="label">Nombre de la campaña</label>
                <input className="input-field" placeholder="Ej: Colección Verano 2026"
                  value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Presupuesto diario (USD)</label>
                <input className="input-field" type="number" min="1" placeholder="50"
                  value={form.daily_budget} onChange={e => setField('daily_budget', Number(e.target.value))} />
              </div>
              <div>
                <label className="label">URL de tu producto/servicio</label>
                <input className="input-field" type="url" placeholder="https://mitienda.com"
                  value={form.product_url} onChange={e => setField('product_url', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="section-title mb-4">🎯 Objetivo de la campaña</h2>
            <div className="grid grid-cols-2 gap-3">
              {OBJECTIVES.map(obj => (
                <button key={obj.value} onClick={() => setField('objective', obj.value)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    background: form.objective === obj.value ? 'rgba(79,110,247,0.12)' : 'var(--surface2)',
                    border: `1px solid ${form.objective === obj.value ? 'rgba(79,110,247,0.5)' : 'var(--border)'}`,
                  }}>
                  <p className="text-sm font-semibold mb-1">{obj.label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{obj.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={goToContent} className="btn-primary px-8">Siguiente → Contenido</button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Contenido ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title mb-5">📝 Descripción del producto/servicio</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Cuanto más detallado, mejores son los textos que genera la IA. Incluí: qué vendés, precio, beneficios clave, diferencial.
            </p>
            <div className="space-y-5">
              <div>
                <label className="label">Descripción completa *</label>
                <textarea className="input-field" rows={5}
                  placeholder="Ej: Vendo ropa femenina de lino natural, colección primavera-verano 2026. Precios de $29 a $89 USD. Envío gratis en compras +$60. Tallas XS-XL. Mi clienta ideal es mujer de 25-45 años que busca estilo casual-elegante para el día a día. Mi diferencial es la calidad del lino y los colores exclusivos."
                  value={form.product_description} onChange={e => setField('product_description', e.target.value)} />
              </div>
              <div>
                <label className="label">Público objetivo (opcional — la IA también lo sugiere)</label>
                <textarea className="input-field" rows={2}
                  placeholder="Ej: Mujeres 28-45 años, Argentina y Uruguay, interesadas en moda, lifestyle, sustentabilidad"
                  value={form.target_audience} onChange={e => setField('target_audience', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Subida de creativos */}
          <div className="card p-6">
            <h2 className="section-title mb-2">🖼 Creativos (imágenes o videos)</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Opcional. Si no subís nada ahora podés agregarlos después. Recomendado: 1080×1080px o 1080×1920px.
            </p>
            <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all hover:border-accent"
                 style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
                 onClick={() => fileRef.current?.click()}>
              <div className="text-4xl mb-3">☁️</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                <span style={{ color: 'var(--accent)' }}>Hacé clic</span> o arrastrá tus archivos aquí
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                PNG, JPG, MP4 · Máx. 50MB por archivo
              </p>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
            </div>
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                       style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    {f.type.startsWith('video') ? '🎥' : '🖼'} {f.name}
                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                      className="ml-1 text-xs opacity-50 hover:opacity-100" style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-ghost">← Atrás</button>
            <button onClick={generateWithAI} disabled={loading} className="btn-primary px-8">
              🤖 Generar copies con IA →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Generando / Revisión IA ── */}
      {step === 2 && (
        <div>
          {genStep >= 0 ? (
            // Animación de generación
            <div className="card p-12 text-center">
              <div className="font-display text-xl font-bold mb-2">⚡ AdFlow IA trabajando...</div>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Esto tarda entre 10 y 20 segundos</p>
              <div className="space-y-3 max-w-sm mx-auto text-left">
                {GEN_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                       style={{
                         background: i <= genStep ? 'var(--surface2)' : 'transparent',
                         border: i === genStep ? '1px solid var(--accent)' : i < genStep ? '1px solid var(--accent3)' : '1px solid transparent',
                         opacity: i > genStep + 1 ? 0.3 : 1,
                       }}>
                    {i < genStep ? (
                      <span style={{ color: 'var(--accent3)' }}>✓</span>
                    ) : i === genStep ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'var(--border)' }} />
                    )}
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : aiCopies ? (
            // Revisión de copies generados
            <div className="space-y-5">
              <div className="p-4 rounded-xl flex items-center gap-3"
                   style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)' }}>
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent3)' }}>¡Copies generados exitosamente!</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Revisá y ajustá según necesites antes de publicar</p>
                </div>
              </div>

              {/* Headlines */}
              <div className="card p-5">
                <h3 className="section-title mb-1">Headlines (títulos)</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Seleccioná el principal. Los otros se usarán para A/B testing.</p>
                <div className="space-y-2">
                  {aiCopies.headlines.map((h, i) => (
                    <button key={i} onClick={() => setSelectedHeadline(i)}
                      className="w-full p-3 rounded-xl text-left text-sm transition-all"
                      style={{
                        background: selectedHeadline === i ? 'rgba(79,110,247,0.12)' : 'var(--surface2)',
                        border: `1px solid ${selectedHeadline === i ? 'rgba(79,110,247,0.5)' : 'var(--border)'}`,
                      }}>
                      <span className="text-xs mr-2" style={{ color: selectedHeadline === i ? 'var(--accent)' : 'var(--muted)' }}>
                        {selectedHeadline === i ? '★ Principal' : `Variante ${i + 1}`}
                      </span>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto principal */}
              <div className="card p-5">
                <h3 className="section-title mb-3">Texto principal del anuncio</h3>
                <textarea className="input-field" rows={4}
                  value={aiCopies.primary_text}
                  onChange={e => setAiCopies(prev => prev ? { ...prev, primary_text: e.target.value } : prev)} />
              </div>

              {/* Otros elementos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="section-title mb-2">Call to Action</h3>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{aiCopies.call_to_action}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Botón: {aiCopies.cta_type}</p>
                </div>
                <div className="card p-5">
                  <h3 className="section-title mb-2">Audiencia sugerida</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{aiCopies.audience_suggestion}</p>
                </div>
                <div className="card p-5 col-span-2">
                  <h3 className="section-title mb-2">Análisis de posicionamiento</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{aiCopies.positioning}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => { setStep(1); setAiCopies(null) }} className="btn-ghost">← Regenerar</button>
                <button onClick={saveCampaign} disabled={loading} className="btn-primary px-8">
                  {loading ? '⏳ Guardando...' : '💾 Guardar y continuar →'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── STEP 3: Confirmación ── */}
      {step === 3 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display text-2xl font-bold mb-2">¡Campaña guardada!</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            Tu campaña <strong style={{ color: 'var(--text)' }}>{form.name}</strong> fue guardada como borrador.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            Para publicarla en Facebook, conectá tu cuenta publicitaria en Configuración y luego activá la campaña.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/dashboard?campaign=created')} className="btn-primary">
              Ver dashboard →
            </button>
            <button onClick={() => router.push('/dashboard/settings')} className="btn-ghost">
              Conectar Facebook →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
