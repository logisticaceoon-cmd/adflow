'use client'
// src/components/dashboard/PhaseSummary.tsx
// Dashboard quick-glance view: 4 phase cards in a row, all uniform.
// Only the status badge varies. Detailed budget bars + insights live in /dashboard/phases.
import { PHASES, type Phase } from '@/lib/budget-engine'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'

interface PhaseRow {
  recommended: number
  spent: number
  roas: number
  conversions: number
  status: 'healthy' | 'risk' | 'optimize' | 'locked'
  insight: string
}

interface Props {
  currency: string
  phaseData: Record<Phase, PhaseRow>
}

const STATUS_BADGE: Record<PhaseRow['status'], { label: string; variant: BadgeVariant }> = {
  healthy:  { label: 'Saludable',  variant: 'success' },
  risk:     { label: 'En riesgo',  variant: 'warning' },
  optimize: { label: 'Optimizar',  variant: 'info'    },
  locked:   { label: 'Bloqueada',  variant: 'locked'  },
}

function roasColor(r: number): string {
  if (r >= 3)   return 'var(--ds-color-success)'
  if (r >= 1.5) return 'var(--ds-color-warning)'
  if (r > 0)    return 'var(--ds-color-danger)'
  return 'var(--ds-text-muted)'
}

export default function PhaseSummary({ currency, phaseData }: Props) {
  // Best-performing (highest ROAS among non-locked phases) gets a subtle
  // success border accent.
  const bestPhaseKey = PHASES.reduce<string | null>((best, p) => {
    const d = phaseData[p.key]
    if (!d || d.status === 'locked' || d.roas <= 0) return best
    if (!best) return p.key
    const bd = phaseData[best as Phase]
    return d.roas > bd.roas ? p.key : best
  }, null)

  return (
    <div className="module-enter module-enter-5" style={{ marginBottom: 32 }}>
      <SectionHeader
        title="Fases del funnel"
        subtitle="Estado de cada fase este mes"
        action={{ label: 'Ver detalle →', href: '/dashboard/phases' }}
      />

      <div className="ds-grid-4">
        {PHASES.map(p => {
          const data = phaseData[p.key]
          if (!data) return null
          const isLocked = data.status === 'locked'
          const isBest = p.key === bestPhaseKey
          const badge = STATUS_BADGE[data.status]
          const budgetPct = data.recommended > 0
            ? Math.min(100, Math.round((data.spent / data.recommended) * 100))
            : 0

          return (
            <div key={p.key} className="card" style={{
              padding: 16,
              opacity: isLocked ? 0.45 : 1,
              borderColor: isBest ? 'var(--ds-color-success-border)' : undefined,
              boxShadow: isBest
                ? 'var(--ds-shadow-md), 0 0 24px rgba(52, 211, 153, 0.08), var(--ds-card-inner-glow)'
                : undefined,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {/* Header — icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'var(--ds-color-primary-soft)',
                  border: '1px solid var(--ds-color-primary-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                }}>{p.icon}</div>
                <p style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--ds-text-primary)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.key} · {p.name}
                </p>
              </div>

              {/* Metrics — 2 columns */}
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 9, fontWeight: 600, color: 'var(--ds-text-label)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
                  }}>Gasto</p>
                  <p style={{
                    fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
                    color: 'var(--ds-text-primary)',
                  }}>
                    {currency}{data.spent.toFixed(0)}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 9, fontWeight: 600, color: 'var(--ds-text-label)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
                  }}>ROAS</p>
                  <p style={{
                    fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
                    color: roasColor(data.roas),
                  }}>
                    {data.roas > 0 ? `${data.roas.toFixed(1)}x` : '—'}
                  </p>
                </div>
              </div>

              {/* Budget progress bar — premium with tip glow */}
              {!isLocked && data.recommended > 0 && (
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-bar-fill" style={{ width: `${budgetPct}%` }} />
                </div>
              )}

              {/* Status badge */}
              <div>
                <Badge variant={badge.variant} size="sm" dot>
                  {badge.label}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
