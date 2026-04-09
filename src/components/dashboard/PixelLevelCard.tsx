'use client'
// src/components/dashboard/PixelLevelCard.tsx
// Compact card for the main dashboard: shows the user's pixel level
// alongside a progress bar to the next level. Renders nothing if no pixel.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LevelBadge from './LevelBadge'
import LevelProgress from './LevelProgress'

interface PixelRow {
  level: number
  level_name: string
  events_data: any
}

// Hex tones so we can concat alpha suffixes (e.g. `${color}14`) for glow.
const LEVEL_COLORS: Record<number, string> = {
  0: '#8892b0',
  1: '#f87171', 2: '#f87171',
  3: '#fbbf24', 4: '#fbbf24',
  5: '#34d399', 6: '#34d399',
  7: '#22d3ee',
  8: '#a78bfa',
}

export default function PixelLevelCard() {
  const [pa, setPa] = useState<PixelRow | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !active) return
      supabase
        .from('pixel_analysis')
        .select('level, level_name, events_data')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (active) {
            if (data) setPa(data as PixelRow)
            setLoaded(true)
          }
        })
    })
    return () => { active = false }
  }, [])

  if (!loaded || !pa) return null

  const level = pa.level
  const ev = pa.events_data || {}
  const nextLevel = Math.min(level + 1, 8)
  const currentColor = LEVEL_COLORS[level]
  const nextColor    = LEVEL_COLORS[nextLevel]

  // Choose the metric that gates the next level
  const map: Record<number, { current: number; required: number; label: string }> = {
    0: { current: ev.PageView?.count_30d    ?? 0, required: 100,  label: 'PageView (30d)' },
    1: { current: ev.PageView?.count_30d    ?? 0, required: 500,  label: 'PageView (30d)' },
    2: { current: ev.ViewContent?.count_30d ?? 0, required: 1000, label: 'ViewContent (30d)' },
    3: { current: ev.AddToCart?.count_30d   ?? 0, required: 100,  label: 'AddToCart (30d)' },
    4: { current: ev.Purchase?.count_30d    ?? 0, required: 50,   label: 'Purchase (30d)' },
    5: { current: ev.Purchase?.count_30d    ?? 0, required: 100,  label: 'Purchase (30d)' },
    6: { current: ev.Purchase?.count_180d   ?? 0, required: 500,  label: 'Purchase (180d)' },
    7: { current: ev.Purchase?.count_180d   ?? 0, required: 1000, label: 'Purchase (180d)' },
  }
  const m = map[level]

  return (
    <Link href="/dashboard/pixel" style={{ textDecoration: 'none', display: 'block' }} className="mb-6 module-enter module-enter-1">
      <div className="card card-hover" style={{
        padding: 20,
        borderTop: `2px solid ${currentColor}`,
        cursor: 'pointer',
        boxShadow: `var(--ds-shadow-md), 0 0 32px ${currentColor}14, var(--ds-card-inner-glow)`,
      }}>
        <div className="flex items-center gap-5">
          <LevelBadge level={level} levelName={pa.level_name} size="sm" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-text-secondary)', marginBottom: 4 }}>
              Tu pixel · Nivel {level} de 8
            </p>
            {m && level < 8 ? (
              <LevelProgress
                current={m.current}
                required={m.required}
                metric={m.label}
                nextLevel={nextLevel}
                currentColor={currentColor}
                nextColor={nextColor}
              />
            ) : (
              <p style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                👑 Nivel máximo alcanzado
              </p>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)', flexShrink: 0 }}>
            Ver detalle →
          </span>
        </div>
      </div>
    </Link>
  )
}
