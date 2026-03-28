'use client'
// src/components/campaign/StepDiagnosis.tsx — Step 1: Diagnóstico
import type { CreateCampaignForm } from '@/types'
import type { DiagnosisData } from './shared'
import {
  ADV_STATUS_OPTIONS, BUSINESS_TYPE_OPTIONS,
  OBJECTIVE_OPTIONS, BUDGET_OPTIONS,
} from './shared'

interface Props {
  diagnosis: DiagnosisData
  setDiagField: <K extends keyof DiagnosisData>(field: K, value: string) => void
  form: Pick<CreateCampaignForm, 'whatsapp_number'>
  setField: <K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) => void
  error: string
  onBack: () => void
  onNext: () => void
}

function DiagOption({ icon, label, selected, onClick }: {
  icon: string; label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all" style={{
      background: selected ? 'rgba(233,30,140,0.12)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? 'rgba(233,30,140,0.40)' : 'rgba(255,255,255,0.08)'}`,
      boxShadow: selected ? '0 0 16px rgba(233,30,140,0.12)' : 'none',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? '#fff' : 'rgba(255,255,255,0.72)' }}>{label}</span>
      {selected && (
        <span style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: '#ea1b7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0 }}>✓</span>
      )}
    </button>
  )
}

const cardStyle = {
  borderRadius: 18, padding: 20,
  background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
  border: '1px solid rgba(255,255,255,0.09)',
}

export default function StepDiagnosis({ diagnosis, setDiagField, form, setField, error, onBack, onNext }: Props) {
  return (
    <div className="space-y-5">
      {/* Intro banner */}
      <div style={{ borderRadius: 16, padding: '14px 18px', background: 'linear-gradient(135deg, rgba(233,30,140,0.10), rgba(98,196,176,0.07))', border: '1px solid rgba(233,30,140,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔍</span>
        <div>
          <p className="text-sm font-semibold">Diagnóstico inteligente</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Respondé 3 preguntas para que la IA diseñe la estrategia perfecta para vos</p>
        </div>
      </div>

      {/* Q1 — Advertising status */}
      <div style={cardStyle}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#e8e8f8' }}>1. ¿En qué momento está tu negocio con la publicidad?</p>
        <div className="space-y-2">
          {ADV_STATUS_OPTIONS.map(opt => (
            <DiagOption key={opt.value} {...opt}
              selected={diagnosis.advertisingStatus === opt.value}
              onClick={() => setDiagField('advertisingStatus', opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Q2 — Business type */}
      <div style={cardStyle}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#e8e8f8' }}>2. ¿Qué tipo de negocio tenés?</p>
        <div className="space-y-2">
          {BUSINESS_TYPE_OPTIONS.map(opt => (
            <DiagOption key={opt.value} {...opt}
              selected={diagnosis.businessType === opt.value}
              onClick={() => setDiagField('businessType', opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Q3 — Main objective */}
      <div style={cardStyle}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#e8e8f8' }}>3. ¿Qué resultado necesitás YA?</p>
        <div className="space-y-2">
          {OBJECTIVE_OPTIONS.map(opt => (
            <DiagOption key={opt.value} {...opt}
              selected={diagnosis.mainObjective === opt.value}
              onClick={() => setDiagField('mainObjective', opt.value)}
            />
          ))}
        </div>
      </div>

      {/* WhatsApp field — shown when objective is whatsapp */}
      {diagnosis.mainObjective === 'whatsapp' && (
        <div style={{ borderRadius: 18, padding: 20, background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(37,211,102,0.03))', border: '1px solid rgba(37,211,102,0.25)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#e8e8f8' }}>💬 Número de WhatsApp *</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Con código de país. Los anuncios llevarán directo a una conversación de WhatsApp.</p>
          <input className="input-field" type="tel" placeholder="+549 11 1234-5678"
            value={form.whatsapp_number}
            onChange={e => setField('whatsapp_number', e.target.value as any)}
          />
        </div>
      )}

      {/* Q4 & Q5 — only if not first_time */}
      {diagnosis.advertisingStatus && diagnosis.advertisingStatus !== 'first_time' && (
        <>
          <div style={cardStyle}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#e8e8f8' }}>
              4. ¿Cuánto invertís por mes?
              <span style={{ color: 'var(--muted)', fontWeight: 400 }}> (aproximado)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setDiagField('monthlyBudget', opt.value)}
                  className="px-3 py-2.5 rounded-xl text-left text-sm transition-all"
                  style={{
                    background: diagnosis.monthlyBudget === opt.value ? 'rgba(233,30,140,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${diagnosis.monthlyBudget === opt.value ? 'rgba(233,30,140,0.40)' : 'rgba(255,255,255,0.08)'}`,
                    color: diagnosis.monthlyBudget === opt.value ? '#fff' : 'rgba(255,255,255,0.65)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#e8e8f8' }}>
              5. ¿Cuál es tu ROAS o costo por lead actual?
              <span style={{ color: 'var(--muted)', fontWeight: 400 }}> (opcional)</span>
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Ej: "ROAS 2.5x", "CPL $3", "CPA $15"</p>
            <input className="input-field" placeholder='Ej: "ROAS 2x", "CPL $3 USD"'
              value={diagnosis.currentRoas}
              onChange={e => setDiagField('currentRoas', e.target.value)}
            />
          </div>
        </>
      )}

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost">← Atrás</button>
        <button onClick={onNext} className="btn-primary px-8">Siguiente → Estrategia</button>
      </div>
    </div>
  )
}
