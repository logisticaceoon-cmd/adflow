// src/components/dashboard/AlertsOpportunities.tsx
// Splits decision-engine alerts into alerts (red) vs opportunities (green).
// Data comes as props from the server-side decision engine.
import Link from 'next/link'
import type { DecisionAlert } from '@/lib/decision-engine'

interface Props {
  alerts: DecisionAlert[]
}

const PANEL_BASE: React.CSSProperties = {
  padding: 'var(--ds-space-lg)',
  borderRadius: 'var(--ds-card-radius)',
  background: 'var(--ds-card-bg)',
  border: '1px solid var(--ds-card-border)',
  backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
  WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
  boxShadow: 'var(--ds-shadow-sm)',
}

export default function AlertsOpportunities({ alerts }: Props) {
  const alertItems        = alerts.filter(a => a.type === 'alert').slice(0, 4)
  const opportunityItems  = alerts.filter(a => a.type === 'opportunity').slice(0, 4)

  return (
    <div className="dash-anim-5 ds-grid-2" style={{ marginBottom: 'var(--ds-space-lg)' }}>
      {/* ALERTS — things to worry about */}
      <div style={{ ...PANEL_BASE, borderLeft: '3px solid var(--ds-color-danger)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
            color: 'var(--ds-text-primary)',
          }}>
            Alertas
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 12 }}>
          Cosas que necesitan tu atención ahora
        </p>
        {alertItems.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
            Sin alertas activas. Todo está en orden.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertItems.map(a => (
              <li key={a.id} style={{
                padding: 12, borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-color-danger-soft)',
                border: '1px solid var(--ds-color-danger-border)',
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--ds-color-danger)',
                  marginBottom: 3, lineHeight: 1.35,
                }}>
                  {a.icon} {a.title}
                </p>
                <p style={{
                  fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5,
                  marginBottom: a.cta?.href ? 6 : 0,
                }}>
                  {a.description}
                </p>
                {a.cta?.href && (
                  <Link href={a.cta.href} style={{
                    fontSize: 11, color: 'var(--ds-color-danger)', fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    {a.cta.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* OPPORTUNITIES — things to capitalize on */}
      <div style={{ ...PANEL_BASE, borderLeft: '3px solid var(--ds-color-success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
            color: 'var(--ds-text-primary)',
          }}>
            Oportunidades
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 12 }}>
          Cosas que podés hacer para crecer más rápido
        </p>
        {opportunityItems.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
            Sin oportunidades detectadas por ahora.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opportunityItems.map(o => (
              <li key={o.id} style={{
                padding: 12, borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-color-success-soft)',
                border: '1px solid var(--ds-color-success-border)',
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--ds-color-success)',
                  marginBottom: 3, lineHeight: 1.35,
                }}>
                  {o.icon} {o.title}
                </p>
                <p style={{
                  fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5,
                  marginBottom: o.cta?.href ? 6 : 0,
                }}>
                  {o.description}
                </p>
                {o.cta?.href && (
                  <Link href={o.cta.href} style={{
                    fontSize: 11, color: 'var(--ds-color-success)', fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    {o.cta.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
