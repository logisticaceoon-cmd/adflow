'use client'
// src/components/dashboard/NextBestAction.tsx
// The "GPS" of growth: shows the single most important action right now
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
      <div className="dash-anim-3 mb-6 p-6" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Calculando tu siguiente mejor acción...</p>
      </div>
    )
  }

  // Sort by priority and pick the top one
  const ordered = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
  const main = ordered[0]
  const secondary = ordered.slice(1, 4)

  if (!main) {
    return (
      <div className="dash-anim-3 mb-6 p-6" style={{
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(6,214,160,0.06), rgba(98,196,176,0.04))',
        border: '1px solid rgba(6,214,160,0.20)',
        borderLeft: '4px solid #06d6a0',
      }}>
        <p style={{ fontSize: 14, color: '#06d6a0', fontWeight: 600 }}>
          ✓ Todo en orden por ahora. Volvé después de publicar nuevas campañas.
        </p>
      </div>
    )
  }

  return (
    <div className="dash-anim-3 mb-6" style={{
      borderRadius: 20, padding: '24px 28px',
      background: 'linear-gradient(135deg, rgba(233,30,140,0.10) 0%, rgba(233,30,140,0.04) 100%)',
      border: '1px solid rgba(233,30,140,0.25)',
      borderLeft: '4px solid #e91e8c',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(233,30,140,0.10), 0 0 60px rgba(233,30,140,0.05)',
    }}>
      <div className="flex items-start gap-5">
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: 'rgba(233,30,140,0.15)',
          border: '1px solid rgba(233,30,140,0.35)',
          boxShadow: '0 0 24px rgba(233,30,140,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Compass size={28} style={{ color: '#f9a8d4', filter: 'drop-shadow(0 0 6px rgba(234,27,126,0.60))' }} strokeWidth={1.75} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-2">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Tu siguiente mejor acción
            </p>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(234,27,126,0.20)', color: '#f9a8d4',
              border: '1px solid rgba(234,27,126,0.40)',
            }}>
              GPS
            </span>
          </div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 4,
            lineHeight: 1.3,
          }}>
            {main.icon} {main.title}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, marginBottom: 14, maxWidth: 640 }}>
            {main.description}
          </p>

          {main.action?.href ? (
            <Link href={main.action.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #ea1b7e, #c5006a)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 6px 24px rgba(234,27,126,0.40), 0 0 32px rgba(234,27,126,0.20)',
              transition: 'all 0.2s',
            }}>
              {main.action.label} <ArrowRight size={14} />
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Sin acción directa — revisá manualmente.</span>
          )}

          {secondary.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                También podés
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {secondary.map(s => (
                  <li key={s.id}>
                    {s.action?.href ? (
                      <Link href={s.action.href} style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.70)',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{s.icon}</span>
                        <span>{s.title}</span>
                        <ArrowRight size={11} style={{ color: '#f9a8d4' }} />
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
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
