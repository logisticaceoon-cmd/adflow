'use client'
// src/components/dashboard/AlertsOpportunities.tsx
// Splits the recommendation list into alerts and opportunities.
// Migrated to unified design system.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recommendation } from '@/lib/recommendation-engine'

const ALERT_TYPES = new Set(['pause', 'scale_down'])
const OPPORTUNITY_TYPES = new Set(['scale_up', 'activate', 'create', 'level_up', 'optimize'])

const PANEL_BASE: React.CSSProperties = {
  padding: 'var(--ds-space-lg)',
  borderRadius: 'var(--ds-card-radius)',
  background: 'var(--ds-card-bg)',
  border: '1px solid var(--ds-card-border)',
  backdropFilter: 'blur(var(--ds-card-blur))',
  WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
  boxShadow: 'var(--ds-shadow-sm)',
}

export default function AlertsOpportunities() {
  const [items, setItems] = useState<Recommendation[] | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(d => { if (active) setItems(d.recommendations || []) })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [])

  if (items === null) {
    return (
      <div style={{ ...PANEL_BASE, marginBottom: 'var(--ds-space-lg)', color: 'var(--ds-text-secondary)', fontSize: 12 }}>
        Cargando alertas y oportunidades...
      </div>
    )
  }

  const alerts        = items.filter(i => ALERT_TYPES.has(i.type)).slice(0, 4)
  const opportunities = items.filter(i => OPPORTUNITY_TYPES.has(i.type)).slice(0, 4)

  return (
    <div className="dash-anim-5 ds-grid-2" style={{ marginBottom: 'var(--ds-space-lg)' }}>
      {/* ALERTS */}
      <div style={{ ...PANEL_BASE, borderLeft: '3px solid var(--ds-color-danger)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--ds-text-primary)' }}>
            Alertas
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 12 }}>
          Cosas que necesitan tu atención ahora
        </p>
        {alerts.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ds-color-success)' }}>✓ Sin alertas. Todo está en orden.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(a => (
              <li key={a.id} style={{
                padding: 12, borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-color-danger-soft)',
                border: '1px solid var(--ds-color-danger-border)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-color-danger)', marginBottom: 3 }}>
                  {a.icon} {a.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* OPPORTUNITIES */}
      <div style={{ ...PANEL_BASE, borderLeft: '3px solid var(--ds-color-success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--ds-text-primary)' }}>
            Oportunidades
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 12 }}>
          Cosas que podés hacer para crecer más rápido
        </p>
        {opportunities.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>Sin oportunidades nuevas por ahora.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opportunities.map(o => (
              <li key={o.id} style={{
                padding: 12, borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-color-success-soft)',
                border: '1px solid var(--ds-color-success-border)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-color-success)', marginBottom: 3 }}>
                  {o.icon} {o.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: o.action?.href ? 6 : 0 }}>
                  {o.description}
                </p>
                {o.action?.href && (
                  <Link href={o.action.href} style={{ fontSize: 11, color: 'var(--ds-color-success)', fontWeight: 600 }}>
                    {o.action.label}
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
