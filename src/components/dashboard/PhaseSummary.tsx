'use client'
// src/components/dashboard/PhaseSummary.tsx
// Compact phase view: F1/F2/F3/F4 with budget vs spent, ROAS, status badge.
// Migrated to unified design system. Uniform card base for all phases —
// only the status badge changes color.
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
  healthy:  { label: 'Saludable',     variant: 'success' },
  risk:     { label: 'En riesgo',     variant: 'warning' },
  optimize: { label: 'Por optimizar', variant: 'info'    },
  locked:   { label: 'Bloqueada',     variant: 'locked'  },
}

function roasColor(r: number): string {
  if (r >= 3)   return 'var(--ds-color-success)'
  if (r >= 1.5) return 'var(--ds-color-warning)'
  if (r > 0)    return 'var(--ds-color-danger)'
  return 'var(--ds-text-muted)'
}

export default function PhaseSummary({ currency, phaseData }: Props) {
  return (
    <div className="dash-anim-5" style={{
      marginBottom: 'var(--ds-space-lg)',
      padding: 'var(--ds-space-lg)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      borderRadius: 'var(--ds-card-radius)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
    }}>
      <SectionHeader
        title="Tus 4 fases del funnel"
        subtitle="Cómo está rindiendo cada fase de tu funnel este mes"
        action={{ label: 'Ver detalle →', href: '/dashboard/phases' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PHASES.map(p => {
          const data = phaseData[p.key]
          if (!data) return null
          const isLocked = data.status === 'locked'
          const budgetPct = data.recommended > 0 ? Math.min(100, (data.spent / data.recommended) * 100) : 0
          const badge = STATUS_BADGE[data.status]

          return (
            <div key={p.key} style={{
              padding: '14px 18px',
              borderRadius: 'var(--ds-card-radius-sm)',
              background: 'var(--ds-bg-elevated)',
              border: '1px solid var(--ds-card-border)',
              opacity: isLocked ? 0.55 : 1,
              display: 'grid',
              gridTemplateColumns: '180px 1fr 90px 80px 130px',
              gap: 16,
              alignItems: 'center',
            }}>
              {/* Phase name — icon keeps a small accent only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--ds-card-bg)',
                  border: '1px solid var(--ds-card-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}>{p.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-text-primary)', lineHeight: 1.2 }}>{p.fullName}</p>
                  <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 2 }}>{p.objective}</p>
                </div>
              </div>

              {/* Budget bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>
                    {currency}{data.spent.toFixed(0)} / {currency}{data.recommended.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-primary)' }}>
                    {budgetPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${budgetPct}%`,
                    background: 'var(--ds-color-primary)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 4 }}>{data.insight}</p>
              </div>

              {/* Conversions */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>Ventas</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                  {data.conversions || 0}
                </p>
              </div>

              {/* ROAS */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>ROAS</p>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800,
                  color: roasColor(data.roas),
                }}>
                  {data.roas > 0 ? `${data.roas.toFixed(1)}x` : '—'}
                </p>
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
