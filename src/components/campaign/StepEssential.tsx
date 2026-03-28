'use client'
// src/components/campaign/StepEssential.tsx — Step 0: Esencial
import type { CreateCampaignForm } from '@/types'

interface Props {
  form: CreateCampaignForm
  setField: <K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) => void
  currency: string
  currSymbol: string
  budgetUSD: string | null
  error: string
  onNext: () => void
}

export default function StepEssential({ form, setField, currency, currSymbol, budgetUSD, error, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div style={{
        borderRadius: 20, padding: 24,
        background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset',
      }}>
        <h2 className="section-title mb-5" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(233,30,140,0.22), rgba(98,196,176,0.12))',
            border: '1px solid rgba(233,30,140,0.32)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>📝</span>
          <span style={{ color: '#e8e8f8' }}>Contanos sobre tu negocio</span>
        </h2>

        <div className="space-y-5">
          {/* Product description */}
          <div>
            <label className="label">¿Qué vendés? *</label>
            <textarea className="input-field" rows={3}
              placeholder='Ej: "Curso de fotografía online $97. Enseño a sacar fotos profesionales con celular en 4 semanas. Ya tengo 200 alumnos satisfechos."'
              value={form.product_description}
              onChange={e => setField('product_description', e.target.value)}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Cuanto más detallés, mejor será la estrategia</p>
          </div>

          {/* Destination URL */}
          <div>
            <label className="label">
              URL de destino de tus anuncios
              <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(233,30,140,0.15)', color: '#f9a8d4', border: '1px solid rgba(233,30,140,0.25)' }}>
                Obligatorio para e-commerce/ventas
              </span>
            </label>
            <input
              className="input-field" type="url"
              placeholder="https://tutienda.com/producto"
              value={form.destination_url}
              onChange={e => setField('destination_url', e.target.value)}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              La página a la que llevarán tus anuncios. La IA usará este dominio para generar CTAs correctos.
            </p>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="label">
              Número de WhatsApp
              <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>(para anuncios de mensajes)</span>
            </label>
            <input
              className="input-field" type="tel"
              placeholder="+549 11 1234-5678"
              value={form.whatsapp_number}
              onChange={e => setField('whatsapp_number', e.target.value)}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Con código de país. Ej: +54 Argentina, +52 México, +57 Colombia</p>
          </div>

          {/* Budget + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Inversión diaria ({currency}) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, fontWeight: 600, color: 'var(--muted)', pointerEvents: 'none',
                }}>
                  {currSymbol}
                </span>
                <input
                  className="input-field" type="number" min="1"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="10"
                  value={form.daily_budget}
                  onChange={e => setField('daily_budget', Number(e.target.value))}
                />
              </div>
              {budgetUSD && (
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {currSymbol}{form.daily_budget} {currency}/día · {budgetUSD}
                </p>
              )}
            </div>
            <div>
              <label className="label">País o ciudad *</label>
              <input
                className="input-field"
                placeholder='Ej: "Argentina", "México"'
                value={form.target_country}
                onChange={e => setField('target_country', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onNext} className="btn-primary px-8" style={{ fontSize: 14 }}>
          Siguiente → Diagnóstico
        </button>
      </div>
    </div>
  )
}
