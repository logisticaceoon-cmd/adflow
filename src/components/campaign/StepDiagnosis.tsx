'use client'
// src/components/campaign/StepDiagnosis.tsx — Step 2: Diagnóstico
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

interface OptionCardProps {
  icon: string
  label: string
  selected: boolean
  onClick: () => void
}

function OptionCard({ icon, label, selected, onClick }: OptionCardProps) {
  return (
    <button onClick={onClick}
      className="text-left transition-all"
      style={{
        padding: '14px 16px', borderRadius: 14,
        background: selected
          ? 'linear-gradient(135deg, rgba(233,30,140,0.14), rgba(233,30,140,0.04))'
          : 'rgba(255,255,255,0.025)',
        border: `${selected ? '1.5px' : '1px'} solid ${selected ? 'rgba(233,30,140,0.50)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected ? '0 0 20px rgba(233,30,140,0.18)' : 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: selected ? 'rgba(233,30,140,0.18)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1px solid rgba(233,30,140,0.40)' : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 13, fontWeight: selected ? 700 : 500,
        color: selected ? '#ffffff' : 'rgba(255,255,255,0.78)',
        lineHeight: 1.35, flex: 1,
      }}>
        {label}
      </span>
      {selected && (
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#ea1b7e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0,
          boxShadow: '0 0 12px rgba(234,27,126,0.50)',
        }}>✓</div>
      )}
    </button>
  )
}

interface QuestionBlockProps {
  number: number
  title: string
  helper: string
  children: React.ReactNode
}

function QuestionBlock({ number, title, helper, children }: QuestionBlockProps) {
  return (
    <div style={{
      borderRadius: 18, padding: 22,
      background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
      border: '1px solid rgba(255,255,255,0.09)',
    }}>
      <div className="flex items-start gap-3 mb-4">
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(233,30,140,0.20), rgba(98,196,176,0.10))',
          border: '1px solid rgba(233,30,140,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#f9a8d4',
        }}>{number}</div>
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {title}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
            {helper}
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function StepDiagnosis({ diagnosis, setDiagField, form, setField, error, onBack, onNext }: Props) {
  return (
    <div className="space-y-5">
      {/* Step header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f9a8d4', marginBottom: 8 }}>
          Paso 2 de 5 · Diagnóstico
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Tu negocio en 30 segundos
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Tres preguntas rápidas para que la IA entienda tu situación y diseñe la estrategia perfecta.
        </p>
      </div>

      {/* Q1 */}
      <QuestionBlock
        number={1}
        title="¿En qué momento está tu negocio con la publicidad?"
        helper="Esto nos dice qué tan agresiva puede ser la estrategia"
      >
        <div className="grid grid-cols-2 gap-3">
          {ADV_STATUS_OPTIONS.map(opt => (
            <OptionCard key={opt.value} {...opt}
              selected={diagnosis.advertisingStatus === opt.value}
              onClick={() => setDiagField('advertisingStatus', opt.value)}
            />
          ))}
        </div>
      </QuestionBlock>

      {/* Q2 */}
      <QuestionBlock
        number={2}
        title="¿Qué tipo de negocio tenés?"
        helper="Cada tipo de negocio funciona distinto en Meta"
      >
        <div className="grid grid-cols-2 gap-3">
          {BUSINESS_TYPE_OPTIONS.map(opt => (
            <OptionCard key={opt.value} {...opt}
              selected={diagnosis.businessType === opt.value}
              onClick={() => setDiagField('businessType', opt.value)}
            />
          ))}
        </div>
      </QuestionBlock>

      {/* Q3 */}
      <QuestionBlock
        number={3}
        title="¿Qué resultado necesitás YA?"
        helper="Lo más urgente — vamos a optimizar para esto"
      >
        <div className="grid grid-cols-2 gap-3">
          {OBJECTIVE_OPTIONS.map(opt => (
            <OptionCard key={opt.value} {...opt}
              selected={diagnosis.mainObjective === opt.value}
              onClick={() => setDiagField('mainObjective', opt.value)}
            />
          ))}
        </div>
      </QuestionBlock>

      {/* WhatsApp field — shown when objective is whatsapp */}
      {diagnosis.mainObjective === 'whatsapp' && (
        <div style={{ borderRadius: 18, padding: 22, background: 'linear-gradient(135deg, rgba(37,211,102,0.10), rgba(37,211,102,0.03))', border: '1px solid rgba(37,211,102,0.30)' }}>
          <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>
            💬 Tu número de WhatsApp *
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Con código de país. Los anuncios van a abrir el chat directo con tu negocio.
          </p>
          <input className="input-field" type="tel" placeholder="+549 11 1234-5678"
            value={form.whatsapp_number}
            onChange={e => setField('whatsapp_number', e.target.value as any)}
          />
        </div>
      )}

      {/* Q4 & Q5 — only if not first_time */}
      {diagnosis.advertisingStatus && diagnosis.advertisingStatus !== 'first_time' && (
        <>
          <QuestionBlock
            number={4}
            title="¿Cuánto invertís por mes en publicidad?"
            helper="Aproximado — nos ayuda a calibrar las recomendaciones"
          >
            <div className="grid grid-cols-2 gap-3">
              {BUDGET_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setDiagField('monthlyBudget', opt.value)}
                  className="text-left transition-all"
                  style={{
                    padding: '14px 16px', borderRadius: 14,
                    background: diagnosis.monthlyBudget === opt.value
                      ? 'linear-gradient(135deg, rgba(233,30,140,0.14), rgba(233,30,140,0.04))'
                      : 'rgba(255,255,255,0.025)',
                    border: `${diagnosis.monthlyBudget === opt.value ? '1.5px' : '1px'} solid ${diagnosis.monthlyBudget === opt.value ? 'rgba(233,30,140,0.50)' : 'rgba(255,255,255,0.08)'}`,
                    color: diagnosis.monthlyBudget === opt.value ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontSize: 13, fontWeight: diagnosis.monthlyBudget === opt.value ? 700 : 500,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </QuestionBlock>

          <QuestionBlock
            number={5}
            title="¿Tu ROAS o costo por lead actual?"
            helper="Opcional — si lo conocés, mejor calibramos las expectativas"
          >
            <input className="input-field" placeholder='Ej: "ROAS 2x", "CPL $3 USD"'
              value={diagnosis.currentRoas}
              onChange={e => setDiagField('currentRoas', e.target.value)}
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              ROAS = retorno por cada peso invertido. CPL = costo por lead conseguido.
            </p>
          </QuestionBlock>
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
