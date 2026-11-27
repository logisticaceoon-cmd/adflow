'use client'
// Step 0: "Contame tu negocio" — only shown if business_profiles is incomplete
import type { UserGoal, WizardState } from '@/hooks/useCampaignWizard'

interface Props {
  form: WizardState
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void
  error: string
  onNext: () => void
}

const GOALS: { value: UserGoal; icon: string; label: string; desc: string }[] = [
  { value: 'sales',   icon: '💰', label: 'Más ventas',   desc: 'Quiero que la gente compre mi producto o servicio' },
  { value: 'leads',   icon: '👥', label: 'Más leads',    desc: 'Quiero captar contactos interesados en lo que ofrezco' },
  { value: 'traffic', icon: '🚀', label: 'Más tráfico',  desc: 'Quiero que más personas conozcan mi marca' },
]

export default function StepBusiness({ form, setField, error, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Contame tu negocio
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          Con esto solo la IA arma toda tu campaña. Sin formularios, sin jerga técnica.
        </p>

        {/* Product description */}
        <div className="mb-5">
          <label className="label">¿Qué vendés o qué hace tu negocio?</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Ej: Vendo ropa deportiva para mujeres en Buenos Aires, con diseños exclusivos y envío gratis"
            value={form.product_description}
            onChange={e => setField('product_description', e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Website URL */}
        <div className="mb-6">
          <label className="label">¿Tenés sitio web? <span style={{ color: 'var(--ds-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input
            className="input-field"
            placeholder="https://tutienda.com"
            value={form.website_url}
            onChange={e => setField('website_url', e.target.value)}
          />
        </div>

        {/* Goal selection — 3 big buttons */}
        <div className="mb-2">
          <label className="label">¿Qué querés lograr?</label>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {GOALS.map(g => {
              const active = form.goal === g.value
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setField('goal', g.value)}
                  className="text-left transition-all"
                  style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    border: active
                      ? '2px solid var(--ds-color-primary)'
                      : '2px solid var(--ds-card-border)',
                    background: active
                      ? 'rgba(79,110,247,0.08)'
                      : 'var(--ds-bg-elevated)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{g.icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? 'var(--ds-color-primary)' : '#fff', marginBottom: 2 }}>
                      {g.label}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
                      {g.desc}
                    </p>
                  </div>
                  {active && (
                    <span style={{ marginLeft: 'auto', color: 'var(--ds-color-primary)', fontSize: 18, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
