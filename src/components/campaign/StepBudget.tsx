'use client'
// Step 1: "¿Cuánto querés invertir?" — budget + duration
import type { WizardState } from '@/hooks/useCampaignWizard'

interface Props {
  form: WizardState
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void
  currSymbol: string
  budgetUSD: string | null
  error: string
  hasBusinessProfile: boolean | null
  onBack: () => void
  onNext: () => void
}

const DURATIONS: { value: 7 | 14 | 30 | 0; label: string; desc: string }[] = [
  { value: 7,  label: '7 días',     desc: 'Test rápido' },
  { value: 14, label: '14 días',    desc: 'Recomendado' },
  { value: 30, label: '30 días',    desc: 'Ciclo completo' },
  { value: 0,  label: 'Continua',   desc: 'Sin fecha fin' },
]

const BUDGET_PRESETS = [5, 10, 15, 25, 50]

export default function StepBudget({ form, setField, currSymbol, budgetUSD, error, hasBusinessProfile, onBack, onNext }: Props) {
  const totalEstimate = form.duration > 0
    ? `${currSymbol}${(form.daily_budget * form.duration).toLocaleString()} total`
    : `${currSymbol}${form.daily_budget}/día`

  return (
    <div className="space-y-6">
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          ¿Cuánto querés invertir?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          La IA optimiza tu presupuesto para sacarle el máximo. Podés ajustarlo después.
        </p>

        {/* Budget */}
        <div className="mb-6">
          <label className="label">Presupuesto diario ({currSymbol})</label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              min={1}
              className="input-field"
              value={form.daily_budget}
              onChange={e => setField('daily_budget', Math.max(1, Number(e.target.value)))}
              style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', maxWidth: 140 }}
            />
            <div>
              <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>{totalEstimate}</p>
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
                  padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  background: form.daily_budget === amount ? 'var(--ds-color-primary)' : 'var(--ds-bg-elevated)',
                  color: form.daily_budget === amount ? '#fff' : 'var(--ds-text-secondary)',
                  border: form.daily_budget === amount
                    ? '1px solid var(--ds-color-primary)'
                    : '1px solid var(--ds-card-border)',
                }}
              >
                {currSymbol}{amount}
              </button>
            ))}
          </div>

          {/* AI recommendation */}
          <div className="mt-4 p-3 rounded-lg" style={{
            background: 'rgba(79,110,247,0.06)',
            border: '1px solid rgba(79,110,247,0.15)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
              💡 La IA recomienda {currSymbol}15-25/día para empezar y optimizar con datos reales en 7-14 días.
            </p>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="label">¿Por cuánto tiempo?</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {DURATIONS.map(d => {
              const active = form.duration === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setField('duration', d.value)}
                  className="text-left transition-all"
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: active
                      ? '2px solid var(--ds-color-primary)'
                      : '2px solid var(--ds-card-border)',
                    background: active
                      ? 'rgba(79,110,247,0.08)'
                      : 'var(--ds-bg-elevated)',
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--ds-color-primary)' : '#fff' }}>
                    {d.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>{d.desc}</p>
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

      <div className="flex justify-between">
        {!hasBusinessProfile && (
          <button onClick={onBack} className="text-sm" style={{ color: 'var(--ds-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Atrás
          </button>
        )}
        <button onClick={onNext} className="btn-primary ml-auto" style={{ padding: '12px 32px', fontSize: 15, fontWeight: 700 }}>
          Siguiente →
        </button>
      </div>
    </div>
  )
}
