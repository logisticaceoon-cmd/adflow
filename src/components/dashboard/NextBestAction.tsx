'use client'
// src/components/dashboard/NextBestAction.tsx
// The "GPS" of growth: shows the single most important action right now.
// Migrated to unified design system.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Compass, ArrowRight } from 'lucide-react'
import type { Recommendation } from '@/lib/recommendation-engine'

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
      <div className="dash-anim-3" style={{
        marginBottom: 'var(--ds-space-lg)',
        padding: 'var(--ds-space-lg)',
        borderRadius: 'var(--ds-card-radius)',
        background: 'var(--ds-card-bg)',
        border: '1px solid var(--ds-card-border)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Calculando tu siguiente mejor acción...</p>
      </div>
    )
  }

  const ordered = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
  const main = ordered[0]
  const secondary = ordered.slice(1, 4)

  if (!main) {
    return (
      <div className="dash-anim-3" style={{
        marginBottom: 'var(--ds-space-lg)',
        padding: 'var(--ds-space-lg)',
        borderRadius: 'var(--ds-card-radius)',
        background: 'var(--ds-color-success-soft)',
        border: '1px solid var(--ds-color-success-border)',
        borderLeft: '3px solid var(--ds-color-success)',
      }}>
        <p style={{ fontSize: 14, color: 'var(--ds-color-success)', fontWeight: 600 }}>
          ✓ Todo en orden por ahora. Volvé después de publicar nuevas campañas.
        </p>
      </div>
    )
  }

  return (
    <div className="dash-anim-3" style={{
      marginBottom: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      padding: 'var(--ds-space-lg)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      borderLeft: '3px solid var(--ds-color-primary)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'var(--ds-color-primary-soft)',
          border: '1px solid var(--ds-color-primary-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Compass size={24} style={{ color: 'var(--ds-color-primary)' }} strokeWidth={1.75} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <p style={{
              fontSize: 10, fontWeight: 700,
              color: 'var(--ds-color-primary)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Tu siguiente mejor acción
            </p>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: 'var(--ds-color-primary-soft)',
              color: 'var(--ds-color-primary)',
              border: '1px solid var(--ds-color-primary-border)',
            }}>
              GPS
            </span>
          </div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 18, fontWeight: 700,
            color: 'var(--ds-text-primary)', marginBottom: 4,
            lineHeight: 1.3,
          }}>
            {main.icon} {main.title}
          </h2>
          <p style={{
            fontSize: 13, color: 'var(--ds-text-secondary)',
            lineHeight: 1.55, marginBottom: 14, maxWidth: 640,
          }}>
            {main.description}
          </p>

          {main.action?.href ? (
            <Link href={main.action.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 99,
              background: 'var(--ds-color-primary)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              {main.action.label} <ArrowRight size={14} />
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>Sin acción directa — revisá manualmente.</span>
          )}

          {secondary.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--ds-card-border)' }}>
              <p style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--ds-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8,
              }}>
                También podés
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {secondary.map(s => (
                  <li key={s.id}>
                    {s.action?.href ? (
                      <Link href={s.action.href} style={{
                        fontSize: 12, color: 'var(--ds-text-secondary)',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{s.icon}</span>
                        <span>{s.title}</span>
                        <ArrowRight size={11} style={{ color: 'var(--ds-color-primary)' }} />
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
                        {s.icon} {s.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
