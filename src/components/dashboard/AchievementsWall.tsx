'use client'
// src/components/dashboard/AchievementsWall.tsx
// Full grid wall of achievements. Fetches from /api/achievements.
// Supports category filtering and shows real unlock dates.
import { useEffect, useMemo, useState } from 'react'

interface ApiAchievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  unlocked: boolean
  unlocked_at: string | null
}

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'all',          label: 'Todos' },
  { key: 'ventas',       label: 'Ventas' },
  { key: 'nivel',        label: 'Nivel' },
  { key: 'estrategia',   label: 'Estrategia' },
  { key: 'hito',         label: 'Hitos' },
  { key: 'consistencia', label: 'Consistencia' },
]

export default function AchievementsWall() {
  const [achievements, setAchievements] = useState<ApiAchievement[]>([])
  const [category, setCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/achievements')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setAchievements(data.achievements || [])
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(
    () => category === 'all' ? achievements : achievements.filter(a => a.category === category),
    [achievements, category],
  )

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const pct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Cargando logros…</p>
      </div>
    )
  }

  if (!achievements.length) return null

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            🏆 Muro de logros
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Cada hito que vas alcanzando mientras crece tu negocio
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em' }}>
            {unlockedCount} <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>/ {achievements.length}</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--muted)' }}>{pct}% completado</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          boxShadow: '0 0 12px rgba(245,158,11,0.50)',
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {CATEGORIES.map(cat => {
          const active = category === cat.key
          return (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '6px 14px', borderRadius: 99,
                background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#fbbf24' : 'var(--muted)',
                border: active ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', transition: 'all 0.18s',
              }}>
              {cat.label}
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 16,
      }}>
        {filtered.map(a => (
          <div key={a.id}
            style={{
              padding: '16px 12px',
              borderRadius: 14,
              background: a.unlocked
                ? 'linear-gradient(160deg, rgba(245,158,11,0.10), rgba(245,158,11,0.02))'
                : 'rgba(255,255,255,0.02)',
              border: a.unlocked
                ? '1px solid rgba(245,158,11,0.30)'
                : '1px solid rgba(255,255,255,0.06)',
              boxShadow: a.unlocked ? '0 0 24px rgba(245,158,11,0.10)' : 'none',
              opacity: a.unlocked ? 1 : 0.40,
              filter: a.unlocked ? 'none' : 'grayscale(80%)',
              textAlign: 'center',
              transition: 'all 0.2s',
              cursor: 'help',
            }}
            title={a.description}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 10px',
              borderRadius: '50%',
              background: a.unlocked
                ? 'radial-gradient(circle at 38% 38%, rgba(245,158,11,0.40), rgba(245,158,11,0.08))'
                : 'rgba(255,255,255,0.04)',
              border: a.unlocked ? '2px solid rgba(245,158,11,0.60)' : '1.5px solid rgba(255,255,255,0.08)',
              boxShadow: a.unlocked ? '0 0 24px rgba(245,158,11,0.45), 0 0 48px rgba(245,158,11,0.18)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>
              {a.icon}
            </div>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 12, fontWeight: 700,
              color: a.unlocked ? '#fff' : '#5a6478',
              lineHeight: 1.3, marginBottom: 4,
            }}>
              {a.name}
            </p>
            <p style={{
              fontSize: 10, color: 'var(--muted)', lineHeight: 1.4,
              minHeight: 24,
            }}>
              {a.description}
            </p>
            {a.unlocked && a.unlocked_at && (
              <p style={{ fontSize: 9, color: '#fbbf24', marginTop: 4, fontWeight: 600 }}>
                ✓ {new Date(a.unlocked_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
