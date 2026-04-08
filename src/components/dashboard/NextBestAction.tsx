// src/components/dashboard/NextBestAction.tsx
// The GPS — "tu siguiente mejor acción". Sits directly under the hero.
// Data now comes from the strategic decision engine (server-side, via props).
import { ArrowRight } from 'lucide-react'
import TrackedCtaButton from './TrackedCtaButton'
import type { PrimaryAction, SecondaryAction } from '@/lib/decision-engine'

interface Props {
  primaryAction: PrimaryAction
  secondaryActions: SecondaryAction[]
}

const PRIORITY_BORDER: Record<PrimaryAction['priority'], string> = {
  critical:    'var(--ds-color-danger)',
  important:   'var(--ds-color-primary)',
  opportunity: 'var(--ds-color-success)',
}

const PRIORITY_OVERLINE: Record<PrimaryAction['priority'], string> = {
  critical:    'Acción crítica',
  important:   'Tu siguiente mejor acción',
  opportunity: 'Oportunidad',
}

const PRIORITY_OVERLINE_COLOR: Record<PrimaryAction['priority'], string> = {
  critical:    'var(--ds-color-danger)',
  important:   'var(--ds-color-primary)',
  opportunity: 'var(--ds-color-success)',
}

export default function NextBestAction({ primaryAction, secondaryActions }: Props) {
  const borderColor = PRIORITY_BORDER[primaryAction.priority]
  const overlineText = PRIORITY_OVERLINE[primaryAction.priority]
  const overlineColor = PRIORITY_OVERLINE_COLOR[primaryAction.priority]
  const showReason = primaryAction.priority === 'critical' || primaryAction.priority === 'important'

  return (
    <div className="dash-anim-2" style={{
      padding: 24,
      borderRadius: 'var(--ds-card-radius)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      borderLeft: `3px solid ${borderColor}`,
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-sm)',
      marginBottom: 32,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Icon — inline, no decorative container */}
        <span style={{
          fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2,
        }}>
          {primaryAction.icon}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Overline — changes with priority */}
          <p style={{
            fontSize: 10, fontWeight: 600, color: overlineColor,
            textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
          }}>
            {overlineText}
          </p>

          {/* Main title — 15px, clamp to 2 lines */}
          <p style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ds-text-primary)',
            lineHeight: 1.45, marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {primaryAction.title}
          </p>

          {/* Description — secondary */}
          <p style={{
            fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.5,
            marginBottom: showReason ? 8 : 16, maxWidth: 640,
          }}>
            {primaryAction.description}
          </p>

          {/* Reason — only for critical/important, explains WHY this matters */}
          {showReason && primaryAction.id !== 'all_good' && (
            <p style={{
              fontSize: 12, color: 'var(--ds-text-muted)', lineHeight: 1.45,
              marginBottom: 16, fontStyle: 'italic', maxWidth: 640,
            }}>
              {primaryAction.reason}
            </p>
          )}

          {/* Primary CTA — tracked button, fires POST /api/actions/track */}
          {primaryAction.cta.href && (
            <TrackedCtaButton
              actionId={primaryAction.id}
              actionLabel={primaryAction.cta.label}
              href={primaryAction.cta.href}
              source="dashboard_gps_primary"
              className="btn-primary"
              style={{
                fontSize: 13, padding: '10px 20px',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {primaryAction.cta.label} <ArrowRight size={14} />
            </TrackedCtaButton>
          )}

          {/* Secondary actions — max 2, tracked compact links */}
          {secondaryActions.length > 0 && (
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: '1px solid var(--ds-card-border)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{
                fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.10em',
              }}>
                También podrías
              </p>
              {secondaryActions.map(s => (
                <TrackedCtaButton
                  key={s.id}
                  actionId={s.id}
                  actionLabel={s.cta.label}
                  href={s.cta.href}
                  source="dashboard_gps_secondary"
                  style={{
                    fontSize: 13, color: 'var(--ds-text-secondary)',
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span>{s.icon}</span>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.title}
                  </span>
                  <ArrowRight size={11} style={{ color: 'var(--ds-color-primary)', flexShrink: 0 }} />
                </TrackedCtaButton>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
