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
  return (
    <div className="dash-anim-5" style={{ marginBottom: 32 }}>
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
          const badge = STATUS_BADGE[data.status]

          return (
            <div key={p.key} style={{
              padding: 16,
              borderRadius: 'var(--ds-card-radius-sm)',
              background: 'var(--ds-card-bg)',
              border: '1px solid var(--ds-card-border)',
              backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
              WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
              boxShadow: 'var(--ds-shadow-sm)',
              opacity: isLocked ? 0.55 : 1,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {/* Header — icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'var(--ds-bg-elevated)',
                  border: '1px solid var(--ds-card-border)',
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
