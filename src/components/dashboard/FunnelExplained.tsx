'use client'
// src/components/dashboard/FunnelExplained.tsx
// Vertical, pedagogical funnel — each step explains what it means in plain words
import { ArrowDown } from 'lucide-react'

interface PixelEvents {
  PageView:         { count_30d: number }
  ViewContent:      { count_30d: number }
  AddToCart:        { count_30d: number }
  InitiateCheckout: { count_30d: number }
  Purchase:         { count_30d: number }
}

interface Props {
  events: PixelEvents | null
}

interface StepDef {
  label:       string
  emoji:       string
  description: string
  insight:     (n: number, prev: number) => string
  color:       string
}

const STEPS: StepDef[] = [
  {
    label: 'PageView',
    emoji: '👀',
    description: 'Personas que entraron a tu sitio web',
    insight: n => `Llegaron ${n.toLocaleString()} personas a tu web en los últimos 30 días.`,
    color: 'var(--ds-color-primary)',
  },
  {
    label: 'ViewContent',
    emoji: '🔍',
    description: 'Personas que miraron un producto específico',
    insight: (n, prev) => {
      const pct = prev > 0 ? Math.round((n / prev) * 100) : 0
      return `${pct}% de tus visitantes miraron un producto. ${pct >= 50 ? 'Excelente interés.' : pct >= 20 ? 'Interés moderado.' : 'Pocos llegan al producto — revisá tu home.'}`
    },
    color: 'var(--ds-color-primary)',
  },
  {
    label: 'AddToCart',
    emoji: '🛒',
    description: 'Personas que agregaron productos al carrito',
    insight: (n, prev) => {
      const pct = prev > 0 ? Math.round((n / prev) * 100) : 0
      return `${pct}% de los que vieron un producto lo agregaron al carrito. ${pct >= 30 ? 'Muy bueno.' : pct >= 10 ? 'Promedio.' : 'Bajo — revisá precios y CTAs.'}`
    },
    color: 'var(--ds-color-warning)',
  },
  {
    label: 'InitiateCheckout',
    emoji: '💳',
    description: 'Personas que empezaron el proceso de compra',
    insight: (n, prev) => {
      const pct = prev > 0 ? Math.round((n / prev) * 100) : 0
      return `${pct}% de los carritos llegaron al checkout. ${pct >= 60 ? 'Tu checkout convierte bien.' : 'Algunos abandonan el carrito.'}`
    },
    color: 'var(--ds-color-primary)',
  },
  {
    label: 'Purchase',
    emoji: '🎉',
    description: 'Personas que completaron la compra',
    insight: (n, prev) => {
      const pct = prev > 0 ? Math.round((n / prev) * 100) : 0
      return `${pct}% de los que llegaron al checkout completaron la compra. ${pct >= 70 ? '¡Excelente!' : pct >= 40 ? 'Promedio.' : 'Muchos abandonan al pagar — revisá métodos de pago.'}`
    },
    color: 'var(--ds-color-success)',
  },
]

export default function FunnelExplained({ events }: Props) {
  if (!events) {
    return (
      <div className="card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Tu embudo de conversión
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          Cuando el pixel empiece a recolectar datos, vas a ver acá cómo fluyen tus visitantes.
        </p>
      </div>
    )
  }

  const values = [
    events.PageView.count_30d,
    events.ViewContent.count_30d,
    events.AddToCart.count_30d,
    events.InitiateCheckout.count_30d,
    events.Purchase.count_30d,
  ]
  const max = Math.max(...values, 1)

  return (
    <div className="card p-6 mb-6">
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Tu embudo de conversión
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          Así fluyen tus visitantes desde que llegan hasta que compran (últimos 30 días)
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {STEPS.map((step, i) => {
          const value = values[i]
          const prev  = i > 0 ? values[i - 1] : 0
          const widthPct = Math.max(35, (value / max) * 100)

          return (
            <div key={step.label} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Funnel slice — uniform card base, only the icon keeps the accent */}
              <div style={{
                width: `${widthPct}%`,
                padding: '14px 22px',
                borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-card-bg)',
                border: '1px solid var(--ds-card-border)',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'var(--ds-bg-elevated)',
                  border: '1px solid var(--ds-card-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {step.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 12, fontWeight: 700,
                      color: 'var(--ds-text-label)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 22, fontWeight: 800,
                      color: 'var(--ds-text-primary)',
                      letterSpacing: '-0.02em',
                    }}>
                      {value.toLocaleString()}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 4 }}>
                    {step.description}
                  </p>
                  <p style={{ fontSize: 10.5, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
                    💡 {step.insight(value, prev)}
                  </p>
                </div>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div style={{ padding: '6px 0' }}>
                  <ArrowDown size={18} style={{ color: 'rgba(255,255,255,0.20)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
