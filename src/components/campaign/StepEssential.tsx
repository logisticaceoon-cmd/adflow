'use client'
// src/components/campaign/StepEssential.tsx — Step 1: Intent + esencial
import { useState } from 'react'
import type { CreateCampaignForm } from '@/types'
import { TrendingUp, ShoppingBag, Target, MessageCircle, Eye, Repeat } from 'lucide-react'

interface Props {
  form: CreateCampaignForm
  setField: <K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) => void
  currency: string
  currSymbol: string
  budgetUSD: string | null
  error: string
  onNext: () => void
}

interface IntentDef {
  id: string
  icon: React.ElementType
  title: string
  subtitle: string
  color: string
  guidance: string
}

const INTENTS: IntentDef[] = [
  {
    id: 'sales',
    icon: ShoppingBag,
    title: 'Quiero generar más ventas',
    subtitle: 'Convertir tráfico en compradores reales',
    color: 'var(--ds-color-primary)',
    guidance: 'Para ventas necesitamos audiencias calificadas y un destino claro (tu tienda).',
  },
  {
    id: 'leads',
    icon: Target,
    title: 'Quiero conseguir leads',
    subtitle: 'Capturar prospectos calificados',
    color: 'var(--ds-color-primary)',
    guidance: 'Vamos a buscar gente interesada en tu propuesta para llenar tu pipeline.',
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    title: 'Quiero más mensajes',
    subtitle: 'Conversaciones directas por WhatsApp',
    color: '#25D366',
    guidance: 'Tus anuncios van a abrir el chat directamente con tu negocio.',
  },
  {
    id: 'awareness',
    icon: Eye,
    title: 'Quiero que me conozcan',
    subtitle: 'Visibilidad y reconocimiento de marca',
    color: 'var(--ds-color-primary)',
    guidance: 'Vamos a llegar a la mayor cantidad de personas relevantes.',
  },
  {
    id: 'retention',
    icon: Repeat,
    title: 'Quiero que vuelvan',
    subtitle: 'Reactivar clientes existentes',
    color: 'var(--ds-color-warning)',
    guidance: 'Apuntamos a quienes ya te conocen y tienen más probabilidad de comprar.',
  },
  {
    id: 'scale',
    icon: TrendingUp,
    title: 'Quiero escalar lo que funciona',
    subtitle: 'Multiplicar resultados de campañas exitosas',
    color: '#8b5cf6',
    guidance: 'Identificamos lo mejor que ya tenés y lo amplificamos.',
  },
]

export default function StepEssential({ form, setField, currency, currSymbol, budgetUSD, error, onNext }: Props) {
  const [intent, setIntent] = useState<string>('')
  const selected = INTENTS.find(i => i.id === intent)

  return (
    <div className="space-y-6">
      {/* ── Hero: Intent picker ─────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Paso 1 de 5 · Tu intención
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          ¿Qué necesitás de esta campaña?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>
          Elegí el resultado que más te urge. Vamos a diseñar todo en función de eso.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {INTENTS.map((it, i) => {
            const isSelected = intent === it.id
            const Icon = it.icon
            return (
              <button key={it.id}
                onClick={() => setIntent(it.id)}
                className="text-left transition-all"
                style={{
                  padding: '18px 20px', borderRadius: 16,
                  background: isSelected
                    ? `linear-gradient(135deg, ${it.color}18, ${it.color}06)`
                    : 'var(--ds-card-bg)',
                  border: `${isSelected ? '1.5px' : '1px'} solid ${isSelected ? `${it.color}55` : 'var(--ds-card-border)'}`,
                  boxShadow: isSelected
                    ? `0 0 28px ${it.color}25, 0 8px 32px rgba(0,0,0,0.40)`
                    : '0 4px 16px rgba(0,0,0,0.30)',
                  cursor: 'pointer',
                  animationDelay: `${i * 50}ms`,
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${it.color}15`,
                  border: `1px solid ${it.color}40`,
                  boxShadow: isSelected ? `0 0 16px ${it.color}40` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: it.color, filter: `drop-shadow(0 0 4px ${it.color})` }} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 14, fontWeight: 700,
                    color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.92)',
                    marginBottom: 3, lineHeight: 1.3,
                  }}>
                    {it.title}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                    {it.subtitle}
                  </p>
                </div>
                {isSelected && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${it.color}, ${it.color}aa)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 900, flexShrink: 0,
                  }}>✓</div>
                )}
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="mt-4 p-4 rounded-xl" style={{
            background: `${selected.color}10`,
            border: `1px solid ${selected.color}30`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <p style={{ fontSize: 12.5, color: 'var(--ds-text-primary)', lineHeight: 1.6 }}>
              <b style={{ color: selected.color }}>Buena elección.</b> {selected.guidance}
            </p>
          </div>
        )}
      </div>

      {/* ── Form section: practical data ────────────────────────────────── */}
      {intent && (
        <div className="space-y-5" style={{ animation: 'fadeInUp 0.4s ease' }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Contanos sobre tu negocio
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Cuanta más info, mejor va a ser la estrategia que diseñe la IA
            </p>
          </div>

          <div style={{
            borderRadius: 18, padding: 22,
            background: 'var(--ds-card-bg)',
            border: '1px solid var(--ds-card-border)',
          }}>
            <div className="space-y-5">
              {/* Product description */}
              <div>
                <label className="label">¿Qué vendés? *</label>
                <textarea className="input-field" rows={3}
                  placeholder='Ej: "Curso de fotografía online $97. Enseño a sacar fotos profesionales con celular en 4 semanas. Ya tengo 200 alumnos satisfechos."'
                  value={form.product_description}
                  onChange={e => setField('product_description', e.target.value)}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  Cuanto más detallés, mejor será la estrategia
                </p>
              </div>

              {/* Destination URL — show as required when intent is sales */}
              {(intent === 'sales' || intent === 'scale' || intent === 'leads') && (
                <div>
                  <label className="label">
                    URL de destino
                    <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)', border: '1px solid var(--ds-color-primary-border)' }}>
                      Recomendado
                    </span>
                  </label>
                  <input className="input-field" type="url"
                    placeholder="https://tutienda.com/producto"
                    value={form.destination_url}
                    onChange={e => setField('destination_url', e.target.value)}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    La página a la que llevarán tus anuncios. La IA usa este dominio para escribir CTAs claros.
                  </p>
                </div>
              )}

              {/* WhatsApp — only when intent matches */}
              {intent === 'whatsapp' && (
                <div>
                  <label className="label">
                    Número de WhatsApp *
                  </label>
                  <input className="input-field" type="tel"
                    placeholder="+549 11 1234-5678"
                    value={form.whatsapp_number}
                    onChange={e => setField('whatsapp_number', e.target.value)}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    Con código de país. Tus anuncios van a llevar directo a una conversación.
                  </p>
                </div>
              )}

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
                    <input className="input-field" type="number" min="1"
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
                  <input className="input-field"
                    placeholder='Ej: "Argentina", "México"'
                    value={form.target_country}
                    onChange={e => setField('target_country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onNext} className="btn-primary px-8" style={{ fontSize: 14, opacity: intent ? 1 : 0.5, cursor: intent ? 'pointer' : 'not-allowed' }} disabled={!intent}>
          Siguiente → Diagnóstico
        </button>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
