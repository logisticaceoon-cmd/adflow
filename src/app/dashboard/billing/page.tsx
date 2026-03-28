// src/app/dashboard/billing/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PLAN_CREDITS } from '@/lib/plans'
import type { PlanType } from '@/types'
import { Zap, Check, CreditCard, RefreshCw, Star } from 'lucide-react'

const WA_LINK = 'https://wa.me/5491162311970?text=Quiero+mejorar+mi+plan+AdFlow'

const PLANS: Array<{
  key: PlanType
  name: string
  emoji: string
  color: string
  priceNum: string
  pricePeriod: string
  tagline: string
  creditExplain: string
  ideal: string
  featured: boolean
  features: string[]
}> = [
  {
    key: 'free',
    name: 'Free',
    emoji: '🌱',
    color: '#62c4b0',
    priceNum: '0',
    pricePeriod: 'siempre gratis',
    tagline: 'Punto de entrada sin costo',
    creditExplain: 'Acceso completo al generador IA para explorar la plataforma antes de escalar.',
    ideal: 'Ideal para: primeros pasos con publicidad asistida por IA.',
    featured: false,
    features: [
      '10 generaciones IA completas',
      'Copies + segmentación por campaña',
      'Acceso al generador de campañas IA',
      'Soporte por email',
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    emoji: '⚡',
    color: '#f472b6',
    priceNum: '19',
    pricePeriod: '/ mes',
    tagline: 'Para emprendedores con actividad recurrente',
    creditExplain: 'Capacidad para mantener un flujo mensual constante de generación y optimización IA.',
    ideal: 'Ideal para: marcas con campañas activas de forma continua.',
    featured: false,
    features: [
      '100 generaciones IA completas',
      'Copies + segmentación por campaña',
      'Flujo recurrente mensual con IA',
      'Reportes diarios con IA',
      'Soporte prioritario',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    emoji: '🚀',
    color: '#e91e8c',
    priceNum: '49',
    pricePeriod: '/ mes',
    tagline: 'Para negocios en crecimiento',
    creditExplain: 'Mayor capacidad mensual para crear, testear variantes y optimizar campañas con IA de forma sostenida.',
    ideal: 'Ideal para: negocios que escalan con producción IA recurrente.',
    featured: true,
    features: [
      '400 generaciones IA completas',
      'Copies + segmentación por campaña',
      'Alto volumen de creación y testeo IA',
      'Reportes diarios + análisis avanzado',
      'Soporte prioritario',
    ],
  },
  {
    key: 'agency',
    name: 'Agencia',
    emoji: '🏢',
    color: '#f59e0b',
    priceNum: '99',
    pricePeriod: '/ mes',
    tagline: 'Para agencias y operaciones multi-cuenta',
    creditExplain: 'Diseñado para flujos de trabajo con múltiples marcas, alto volumen de generación y operación continua.',
    ideal: 'Ideal para: agencias y equipos que gestionan múltiples clientes.',
    featured: false,
    features: [
      '1000 generaciones IA completas',
      'Copies + segmentación por campaña',
      'Gestión multi-cuenta y escala operativa',
      'Reportes diarios IA',
      'Onboarding y configuración dedicada',
      'Soporte 24/7',
    ],
  },
]

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, credits_total, credits_used, credits_reset_date')
    .eq('id', user!.id)
    .single()

  const currentPlan  = (profile?.plan as PlanType) || 'free'
  const creditsTotal = profile?.credits_total ?? PLAN_CREDITS[currentPlan] ?? 10
  const creditsUsed  = profile?.credits_used  ?? 0
  const remaining    = Math.max(0, creditsTotal - creditsUsed)
  const pct          = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0

  const resetDate = profile?.credits_reset_date
    ? new Date(profile.credits_reset_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const barColor = remaining === 0 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#06d6a0'
  const currentPlanData = PLANS.find(p => p.key === currentPlan)!

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="mb-8 dash-anim-1">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
          Facturación y plan
        </p>
        <h1 className="page-title mb-1.5">Tu plan AdFlow</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Cada plan incluye créditos mensuales para generación IA. Elegí según tu volumen de producción.
        </p>
      </div>

      {/* ── Credits summary card ── */}
      <div className="mb-8 dash-anim-2" style={{
        borderRadius: 20, padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(234,27,126,0.10) 0%, rgba(98,196,176,0.06) 60%, rgba(234,27,126,0.04) 100%)',
        border: '1px solid rgba(233,30,140,0.28)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* top radial glow */}
        <div style={{
          position: 'absolute', top: -60, right: -40,
          width: 240, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,30,140,0.20) 0%, transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        <div className="flex items-start justify-between" style={{ gap: 20, position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(233,30,140,0.18)', border: '1px solid rgba(233,30,140,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard size={14} style={{ color: '#e91e8c' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f9a8d4' }}>
                Créditos este mes
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.06em', color: '#ffffff', lineHeight: 1 }}>
                {remaining}
              </span>
              <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--muted)' }}>/ {creditsTotal}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>créditos disponibles para generación IA · se renuevan mensualmente</p>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 99,
              background: `${currentPlanData.color}1a`,
              border: `1px solid ${currentPlanData.color}45`,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 16 }}>{currentPlanData.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: currentPlanData.color }}>
                Plan {currentPlanData.name}
              </span>
            </div>
            {resetDate && (
              <p style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <RefreshCw size={10} />
                Resetea el {resetDate}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, pct)}%`,
              borderRadius: 99,
              background: remaining === 0
                ? '#ef4444'
                : `linear-gradient(90deg, #e91e8c, ${barColor})`,
              boxShadow: `0 0 10px ${barColor}90`,
              transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <div className="flex justify-between mt-2">
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}% usado este mes</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
              {remaining === 0 ? '⚠ Sin créditos · mejorá tu plan' : remaining <= creditsTotal * 0.2 ? `⚠ Quedan ${remaining} créditos` : `${remaining} disponibles`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Plans grid ── */}
      <div className="dash-anim-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="section-title">Elegí tu plan</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Todos los planes incluyen acceso completo al generador de IA</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan
            const isPaid    = plan.key !== 'free'
            const isDowngrade = plan.key === 'free' && currentPlan !== 'free'

            return (
              <div
                key={plan.key}
                style={{
                  borderRadius: 22,
                  padding: plan.featured ? '28px' : '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(16px)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  // Featured card is the Pro plan — always stands out
                  background: plan.featured
                    ? 'linear-gradient(145deg, rgba(234,27,126,0.13) 0%, rgba(98,196,176,0.07) 60%, rgba(14,4,8,0.95) 100%)'
                    : isCurrent
                      ? `linear-gradient(145deg, ${plan.color}0e 0%, rgba(14,4,8,0.92) 100%)`
                      : 'linear-gradient(145deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
                  border: plan.featured
                    ? '1.5px solid rgba(233,30,140,0.55)'
                    : isCurrent
                      ? `1.5px solid ${plan.color}45`
                      : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: plan.featured
                    ? '0 0 48px rgba(233,30,140,0.22), 0 20px 60px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.07) inset'
                    : isCurrent
                      ? `0 0 28px ${plan.color}18, 0 12px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset`
                      : '0 8px 32px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.04) inset',
                }}
              >
                {/* Radial glow inside featured/current card */}
                {(plan.featured || isCurrent) && (
                  <div style={{
                    position: 'absolute', top: -50, right: -30,
                    width: 200, height: 160, borderRadius: '50%',
                    background: `radial-gradient(circle, ${plan.color}28 0%, transparent 70%)`,
                    filter: 'blur(24px)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Inset top highlight */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: plan.featured
                    ? 'linear-gradient(90deg, transparent, rgba(234,27,126,0.60), rgba(98,196,176,0.40), transparent)'
                    : `linear-gradient(90deg, transparent, ${plan.color}30, transparent)`,
                  pointerEvents: 'none',
                }} />

                {/* Badge */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, minHeight: 24, position: 'relative', zIndex: 1 }}>
                  {plan.featured && !isCurrent && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 99,
                      background: 'linear-gradient(135deg, rgba(234,27,126,0.28), rgba(98,196,176,0.18))',
                      color: '#f9a8d4',
                      border: '1px solid rgba(233,30,140,0.45)',
                      boxShadow: '0 0 12px rgba(233,30,140,0.25)',
                    }}>
                      <Star size={9} fill="currentColor" /> Más popular
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 99,
                      background: `${plan.color}1a`,
                      color: plan.color,
                      border: `1px solid ${plan.color}40`,
                    }}>
                      Plan actual ✓
                    </div>
                  )}
                </div>

                {/* Icon + name + tagline */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    background: `radial-gradient(circle at 38% 38%, ${plan.color}30, ${plan.color}08)`,
                    border: `1.5px solid ${plan.color}30`,
                    boxShadow: plan.featured ? `0 0 20px ${plan.color}30` : `0 0 12px ${plan.color}15`,
                  }}>
                    {plan.emoji}
                  </div>
                  <div>
                    <p style={{
                      fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2,
                      textShadow: plan.featured ? '0 0 20px rgba(233,30,140,0.30)' : 'none',
                    }}>
                      {plan.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{plan.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  {plan.priceNum === '0' ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.05em', color: plan.color, lineHeight: 1 }}>
                        Gratis
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', alignSelf: 'flex-start', marginTop: 8 }}>USD</span>
                      <span style={{
                        fontSize: 46, fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1,
                        color: plan.featured ? '#ffffff' : plan.color,
                        textShadow: plan.featured ? `0 0 30px ${plan.color}50` : 'none',
                      }}>
                        {plan.priceNum}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4, alignSelf: 'flex-end' }}>
                        {plan.pricePeriod}
                      </span>
                    </div>
                  )}
                </div>

                {/* Credits highlight block */}
                <div style={{
                  padding: '14px 16px', borderRadius: 14, marginBottom: 18,
                  background: plan.featured
                    ? 'rgba(233,30,140,0.12)'
                    : `${plan.color}0d`,
                  border: plan.featured
                    ? '1px solid rgba(233,30,140,0.30)'
                    : `1px solid ${plan.color}22`,
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em',
                      color: plan.featured ? '#f9a8d4' : plan.color,
                      textShadow: plan.featured ? '0 0 16px rgba(233,30,140,0.50)' : 'none',
                    }}>
                      {PLAN_CREDITS[plan.key]}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>créditos / mes</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
                    {plan.creditExplain}
                  </p>
                </div>

                {/* Ideal for */}
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                  {plan.ideal}
                </p>

                {/* Features */}
                <ul style={{
                  listStyle: 'none', padding: 0, margin: '0 0 22px',
                  display: 'flex', flexDirection: 'column', gap: 9,
                  position: 'relative', zIndex: 1,
                }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: `${plan.color}18`,
                        border: `1px solid ${plan.color}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={9} style={{ color: plan.color }} />
                      </div>
                      <span style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {isCurrent ? (
                    <div style={{
                      textAlign: 'center', fontSize: 13, fontWeight: 600, color: plan.color,
                      padding: '12px', borderRadius: 12,
                      background: `${plan.color}0a`,
                      border: `1px solid ${plan.color}22`,
                    }}>
                      Tu plan actual ✓
                    </div>
                  ) : isDowngrade ? (
                    <div style={{
                      textAlign: 'center', fontSize: 12, color: 'var(--muted)',
                      padding: '12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      Plan básico
                    </div>
                  ) : (
                    <a
                      href={WA_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block', textAlign: 'center',
                        padding: '13px 20px', borderRadius: 13,
                        background: plan.featured
                          ? 'linear-gradient(135deg, #e91e8c, #c5006a)'
                          : `linear-gradient(135deg, ${plan.color}dd, ${plan.color})`,
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: plan.featured
                          ? '0 0 28px rgba(233,30,140,0.50), 0 4px 16px rgba(0,0,0,0.40)'
                          : `0 4px 16px ${plan.color}38`,
                        letterSpacing: '-0.01em',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Button inner highlight */}
                      <span style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                        borderRadius: 'inherit',
                      }} />
                      <span style={{ position: 'relative' }}>Mejorar a {plan.name} →</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="dash-anim-4" style={{ textAlign: 'center', marginTop: 36 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          Los pagos se procesan de forma manual vía WhatsApp. Te contactamos en menos de 24hs.
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
          Los créditos se renuevan el primer día de cada mes · Sin contrato de permanencia · Cambiás de plan cuando quieras
        </p>
      </div>
    </div>
  )
}
