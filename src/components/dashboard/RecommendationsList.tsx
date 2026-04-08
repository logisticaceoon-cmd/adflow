'use client'
// src/components/dashboard/RecommendationsList.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recommendation } from '@/lib/recommendation-engine'

const PRIORITY_STYLES: Record<Recommendation['priority'], { border: string; bg: string; color: string }> = {
  high:   { border: 'var(--ds-color-primary-border)', bg: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)' },
  medium: { border: 'var(--ds-color-warning-border)', bg: 'rgba(245,158,11,0.06)', color: 'var(--ds-color-warning)' },
  low:    { border: 'rgba(255,255,255,0.10)', bg: 'rgba(255,255,255,0.03)', color: '#8892b0' },
}

interface Props {
  limit?: number
  emptyMessage?: string
}

export default function RecommendationsList({ limit, emptyMessage }: Props) {
  const [items,   setItems]   = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(d => { if (active) setItems(d.recommendations || []) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-center" style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
        Cargando recomendaciones...
      </div>
    )
  }

  const visible = limit ? items.slice(0, limit) : items

  if (visible.length === 0) {
    return (
      <div className="p-4 text-center" style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
        {emptyMessage || 'No hay recomendaciones por ahora. Volvé más tarde.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map(r => {
        const style = PRIORITY_STYLES[r.priority]
        return (
          <div key={r.id} className="p-3 rounded-xl"
            style={{ background: style.bg, border: `1px solid ${style.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: style.color, marginBottom: 4 }}>
              {r.icon} {r.title}
            </p>
            <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: r.action ? 6 : 0 }}>
              {r.description}
            </p>
            {r.action?.href && (
              <Link href={r.action.href} style={{ fontSize: 11, color: style.color, fontWeight: 600 }}>
                {r.action.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
