'use client'
// src/components/dashboard/GrowthTimeline.tsx — Vertical timeline of level history
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LevelHistoryRow {
  old_level: number | null
  new_level: number
  level_name: string
  reason: string | null
  created_at: string
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#8892b0',
  1: 'var(--ds-color-danger)', 2: 'var(--ds-color-danger)',
  3: 'var(--ds-color-warning)', 4: 'var(--ds-color-warning)',
  5: 'var(--ds-color-success)', 6: 'var(--ds-color-success)',
  7: '#3b82f6',
  8: '#8b5cf6',
}

export default function GrowthTimeline() {
  const [history, setHistory] = useState<LevelHistoryRow[] | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !active) return
      supabase
        .from('level_history')
        .select('old_level, new_level, level_name, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12)
        .then(({ data }) => { if (active) setHistory((data as LevelHistoryRow[]) || []) })
    })
    return () => { active = false }
  }, [])

  if (history === null) {
    return <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Cargando timeline...</p>
  }

  if (history.length === 0) {
    return (
      <div className="p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
          🌱 Tu viaje de crecimiento empieza aquí.
          <br />
          Cuando subas de nivel vas a ver la historia completa.
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 11, top: 8, bottom: 8, width: 2,
        background: 'linear-gradient(180deg, var(--ds-card-border), rgba(255,255,255,0.05))',
      }} />
      {history.map((h, i) => {
        const color = LEVEL_COLORS[h.new_level] ?? '#8892b0'
        return (
          <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{
              position: 'absolute', left: -19, top: 4,
              width: 18, height: 18, borderRadius: '50%',
              background: `radial-gradient(circle, ${color}, ${color}40)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 10px ${color}80`,
            }} />
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>
                {h.old_level !== null && <span style={{ color: 'var(--ds-text-secondary)' }}>Nivel {h.old_level} → </span>}
                Nivel {h.new_level}: {h.level_name}
              </p>
              {h.reason && <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>{h.reason}</p>}
              <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 4 }}>
                {new Date(h.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
