'use client'
// src/components/dashboard/AlertsOpportunities.tsx
// Splits the recommendation list into alerts (red) and opportunities (green)
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recommendation } from '@/lib/recommendation-engine'

const ALERT_TYPES = new Set(['pause', 'scale_down'])
const OPPORTUNITY_TYPES = new Set(['scale_up', 'activate', 'create', 'level_up', 'optimize'])

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
      <div className="card p-5 mb-6" style={{ color: 'var(--muted)', fontSize: 12 }}>
        Cargando alertas y oportunidades...
      </div>
    )
  }

  const alerts        = items.filter(i => ALERT_TYPES.has(i.type)).slice(0, 4)
  const opportunities = items.filter(i => OPPORTUNITY_TYPES.has(i.type)).slice(0, 4)

  return (
    <div className="dash-anim-5 mb-6 grid grid-cols-2 gap-4">
      {/* ── ALERTS ── */}
      <div className="card p-5" style={{ borderLeft: '3px solid #ef4444' }}>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 16 }}>⚠️</span>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            Alertas
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
          Cosas que necesitan tu atención ahora
        </p>
        {alerts.length === 0 ? (
          <p style={{ fontSize: 12, color: '#06d6a0' }}>✓ Sin alertas. Todo está en orden.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(a => (
              <li key={a.id} className="p-3 rounded-lg" style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', marginBottom: 3 }}>
                  {a.icon} {a.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── OPPORTUNITIES ── */}
      <div className="card p-5" style={{ borderLeft: '3px solid #06d6a0' }}>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 16 }}>💡</span>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            Oportunidades
          </h2>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
          Cosas que podés hacer para crecer más rápido
        </p>
        {opportunities.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sin oportunidades nuevas por ahora.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opportunities.map(o => (
              <li key={o.id} className="p-3 rounded-lg" style={{
                background: 'rgba(6,214,160,0.06)',
                border: '1px solid rgba(6,214,160,0.18)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', marginBottom: 3 }}>
                  {o.icon} {o.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: o.action?.href ? 6 : 0 }}>
                  {o.description}
                </p>
                {o.action?.href && (
                  <Link href={o.action.href} style={{ fontSize: 11, color: '#06d6a0', fontWeight: 600 }}>
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
