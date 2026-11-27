'use client'
// Step 1 (unified): Promo + Objective + Budget + Duration
import type { WizardState, AdFlowObjective } from '@/hooks/useCampaignWizard'
import { ShoppingCart, MessageCircle, Instagram } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  form: WizardState
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void
  currSymbol: string
  budgetUSD: string | null
  error: string
  onNext: () => void
}

const OBJECTIVES: { value: AdFlowObjective; Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  { value: 'sales_web',          Icon: ShoppingCart,  label: 'Vender por mi web',      desc: 'Enviar personas a tu tienda online para comprar', color: 'var(--ds-color-success)' },
  { value: 'sales_whatsapp',     Icon: MessageCircle, label: 'Vender por WhatsApp',    desc: 'Que te escriban al WhatsApp para comprar',        color: '#25D366' },
  { value: 'instagram_traffic',  Icon: Instagram,     label: 'Tráfico a Instagram',    desc: 'Llevar personas a tu perfil de Instagram',        color: '#E1306C' },
]

const DURATIONS: { value: 7 | 14 | 30 | 0; label: string; desc: string }[] = [
  { value: 7,  label: '7 días',     desc: 'Test rápido' },
  { value: 14, label: '14 días',    desc: 'Recomendado' },
  { value: 30, label: '30 días',    desc: 'Ciclo completo' },
  { value: 0,  label: 'Continua',   desc: 'Sin fecha fin' },
]

const BUDGET_PRESETS = [5, 10, 15, 25, 50]

export default function StepCampaign({ form, setField, currSymbol, budgetUSD, error, onNext }: Props) {
  const totalEstimate = form.duration > 0
    ? `${currSymbol}${(form.daily_budget * form.duration).toLocaleString()} total`
    : `${currSymbol}${form.daily_budget}/día`

  return (
    <div className="space-y-5">
      {/* ── Promo description ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <label className="label" style={{ fontSize: 14, marginBottom: 8 }}>
          ¿Qué querés promocionar?
        </label>
        <textarea
          className="input-field"
          placeholder="Ej: Promo 2x1 en remeras de verano hasta el domingo. Envío gratis a todo el país."
          rows={3}
          value={form.campaign_promo}
          onChange={e => setField('campaign_promo', e.target.value)}
          style={{ resize: 'none', lineHeight: 1.6 }}
        />
        <p style={{ fontSize: 11, color: 'var(--ds-text-muted)', marginTop: 6 }}>
          Sé específico: qué producto, qué oferta, qué beneficio. La IA crea los copies basándose en esto.
        </p>
      </div>

      {/* ── Objective ──────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <label className="label" style={{ fontSize: 14, marginBottom: 12 }}>
          ¿Cuál es tu objetivo?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {OBJECTIVES.map(obj => {
            const active = form.campaign_objective === obj.value
            return (
              <button
                key={obj.value}
                type="button"
                onClick={() => setField('campaign_objective', obj.value)}
                className="text-left transition-all"
                style={{
                  padding: '20px 18px', borderRadius: 14, cursor: 'pointer',
                  border: active
                    ? `2px solid ${obj.color}`
                    : '2px solid var(--ds-card-border)',
                  background: active
                    ? `${obj.color}0D`
                    : 'var(--ds-bg-elevated)',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? `${obj.color}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? `${obj.color}30` : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <obj.Icon size={18} style={{ color: active ? obj.color : 'var(--ds-text-secondary)' }} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : 'var(--ds-text-primary)', marginBottom: 4 }}>
                  {obj.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
                  {obj.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Budget + Duration ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div className="grid grid-cols-2 gap-6">
          {/* Budget */}
          <div>
            <label className="label" style={{ fontSize: 14, marginBottom: 8 }}>
              Presupuesto diario ({currSymbol})
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="number"
                min={1}
                className="input-field"
                value={form.daily_budget}
                onChange={e => setField('daily_budget', Math.max(1, Number(e.target.value)))}
                style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', maxWidth: 120 }}
              />
              <div>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>{totalEstimate}</p>
                {budgetUSD && <p style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>{budgetUSD}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {BUDGET_PRESETS.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setField('daily_budget', amount)}
                  className="transition-all"
                  style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: form.daily_budget === amount ? 'var(--ds-color-primary)' : 'var(--ds-bg-elevated)',
                    color: form.daily_budget === amount ? '#fff' : 'var(--ds-text-secondary)',
                    border: form.daily_budget === amount ? '1px solid var(--ds-color-primary)' : '1px solid var(--ds-card-border)',
                  }}
                >
                  {currSymbol}{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="label" style={{ fontSize: 14, marginBottom: 8 }}>¿Por cuánto tiempo?</label>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map(d => {
                const active = form.duration === d.value
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setField('duration', d.value)}
                    className="text-left transition-all"
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: active ? '2px solid var(--ds-color-primary)' : '2px solid var(--ds-card-border)',
                      background: active ? 'rgba(79,110,247,0.08)' : 'var(--ds-bg-elevated)',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--ds-color-primary)' : '#fff' }}>
                      {d.label}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>{d.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI recommendation tip */}
        <div className="mt-4 p-3 rounded-lg" style={{
          background: 'rgba(79,110,247,0.06)',
          border: '1px solid rgba(79,110,247,0.15)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
            La IA recomienda {currSymbol}15-25/día para empezar y optimizar con datos reales en 7-14 días.
          </p>
        </div>
      </div>

      {/* ── Error + Next ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onNext} className="btn-primary" style={{ padding: '12px 32px', fontSize: 15, fontWeight: 700 }}>
          Siguiente →
        </button>
      </div>
    </div>
  )
}
