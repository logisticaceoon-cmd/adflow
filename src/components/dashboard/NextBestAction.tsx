'use client'
// src/components/dashboard/NextBestAction.tsx
// The GPS — "tu siguiente mejor acción". Sits directly under the hero
// with a focused CTA and no decorative noise.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Recommendation } from '@/lib/recommendation-engine'

const PANEL_BASE: React.CSSProperties = {
  padding: 24,
  borderRadius: 'var(--ds-card-radius)',
  background: 'var(--ds-card-bg)',
  border: '1px solid var(--ds-card-border)',
  borderLeft: '3px solid var(--ds-color-primary)',
  backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
  WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
  boxShadow: 'var(--ds-shadow-sm)',
  marginBottom: 32,
}

export default function NextBestAction() {
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
      <div className="dash-anim-2" style={{ ...PANEL_BASE, borderLeftColor: 'var(--ds-card-border)' }}>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Calculando tu siguiente mejor acción…</p>
      </div>
    )
  }

  const ordered = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
  const main = ordered[0]
  const secondary = ordered.slice(1, 3)

  // Empty state — calm, reassuring
  if (!main) {
    return (
      <div className="dash-anim-2" style={{
        ...PANEL_BASE,
        borderLeftColor: 'var(--ds-color-success)',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 600, color: 'var(--ds-color-success)',
          textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
        }}>
          Todo en orden
        </p>
        <p style={{ fontSize: 15, color: 'var(--ds-text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
          Seguí monitoreando tus campañas. Las recomendaciones aparecerán acá cuando haya algo para accionar.
        </p>
      </div>
    )
  }

  return (
    <div className="dash-anim-2" style={PANEL_BASE}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Icon — 24px, sin contenedor grande que compita */}
        <span style={{
          fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2,
          filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.35))',
        }}>
          {main.icon || '🧭'}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Overline */}
          <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--ds-color-primary)',
            textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
          }}>
            Tu siguiente mejor acción
          </p>

          {/* Main text — directivo, max 2 líneas */}
          <p style={{
            fontSize: 15, fontWeight: 500, color: 'var(--ds-text-primary)',
            lineHeight: 1.45, marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {main.title}
          </p>

          {/* Sub-description */}
          <p style={{
            fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.5,
            marginBottom: 16, maxWidth: 640,
          }}>
            {main.description}
          </p>

          {/* Primary CTA — button, not a link */}
          {main.action?.href ? (
            <Link href={main.action.href} className="btn-primary" style={{
              fontSize: 13, padding: '10px 20px',
            }}>
              {main.action.label} <ArrowRight size={14} />
            </Link>
          ) : null}

          {/* Secondary actions — max 2 small links */}
          {secondary.length > 0 && (
            <div style={{
              marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              {secondary.map(s => (
                s.action?.href ? (
                  <Link key={s.id} href={s.action.href} style={{
                    fontSize: 13, color: 'var(--ds-text-secondary)',
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    {s.title} <ArrowRight size={11} style={{ color: 'var(--ds-color-primary)' }} />
                  </Link>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
