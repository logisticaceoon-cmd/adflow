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

const PRIORITY_CONFIG: Record<PrimaryAction['priority'], {
  border: string
  overline: string
  overlineColor: string
  glowColor: string
  softBg: string
  softBorder: string
}> = {
  critical: {
    border: 'var(--ds-color-danger)',
    overline: 'Acción crítica',
    overlineColor: 'var(--ds-color-danger)',
    glowColor: 'rgba(248, 113, 113, 0.14)',
    softBg: 'var(--ds-color-danger-soft)',
    softBorder: 'var(--ds-color-danger-border)',
  },
  important: {
    border: 'var(--ds-color-primary)',
    overline: 'Tu siguiente mejor acción',
    overlineColor: 'var(--ds-color-primary)',
    glowColor: 'rgba(124, 110, 240, 0.12)',
    softBg: 'var(--ds-color-primary-soft)',
    softBorder: 'var(--ds-color-primary-border)',
  },
  opportunity: {
    border: 'var(--ds-color-success)',
    overline: 'Oportunidad',
    overlineColor: 'var(--ds-color-success)',
    glowColor: 'rgba(52, 211, 153, 0.12)',
    softBg: 'var(--ds-color-success-soft)',
    softBorder: 'var(--ds-color-success-border)',
  },
}

export default function NextBestAction({ primaryAction, secondaryActions }: Props) {
  const cfg = PRIORITY_CONFIG[primaryAction.priority]
  const showReason = primaryAction.priority === 'critical' || primaryAction.priority === 'important'

  return (
    <div className="card module-enter module-enter-2" style={{
      padding: 24,
      borderLeft: `3px solid ${cfg.border}`,
      boxShadow: `var(--ds-shadow-md), -3px 0 15px ${cfg.glowColor}, var(--ds-card-inner-glow)`,
      marginBottom: 32,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Icon inside a colored soft circle */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: cfg.softBg,
          border: `1px solid ${cfg.softBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, lineHeight: 1,
          boxShadow: `0 0 20px ${cfg.glowColor}`,
        }}>
          {primaryAction.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Overline — changes with priority */}
          <p style={{
            fontSize: 10, fontWeight: 600, color: cfg.overlineColor,
            textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
          }}>
            {cfg.overline}
          </p>

          {/* Main title — Syne 16px, clamp to 2 lines */}
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16, fontWeight: 600, color: 'var(--ds-text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.4, marginBottom: 8,
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
