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
      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Cargando logros…</p>
      </div>
    )
  }

  if (!achievements.length) return null

  return (
    <div className="card" style={{ padding: 24, marginBottom: 32 }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            🏆 Muro de logros
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
            Cada hito que vas alcanzando mientras crece tu negocio
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--ds-color-warning)', letterSpacing: '-0.02em' }}>
            {unlockedCount} <span style={{ fontSize: 14, color: 'var(--ds-text-secondary)', fontWeight: 600 }}>/ {achievements.length}</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>{pct}% completado</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ height: 6, marginBottom: 18 }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.70), #fbbf24, #fcd34d)',
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.50), 0 0 24px rgba(251, 191, 36, 0.20), inset 0 1px 0 rgba(255,255,255,0.24)',
          }}
        />
      </div>

      {/* Category tabs — pill buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {CATEGORIES.map(cat => {
          const active = category === cat.key
          return (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '6px 14px', borderRadius: 999,
                background: active ? 'var(--ds-color-primary-soft)' : 'rgba(255, 255, 255, 0.03)',
                color: active ? 'var(--ds-color-primary)' : 'var(--ds-text-secondary)',
                border: active ? '1px solid var(--ds-color-primary-border)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: active ? '0 0 16px var(--ds-color-primary-glow)' : 'none',
                backdropFilter: 'blur(8px)',
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
            className="achievement-item"
            style={{
              padding: '16px 12px',
              borderRadius: 14,
              background: a.unlocked
                ? 'linear-gradient(160deg, rgba(251, 191, 36, 0.08), rgba(10, 12, 28, 0.40))'
                : 'rgba(10, 12, 28, 0.30)',
              border: a.unlocked
                ? '1px solid var(--ds-color-warning-border)'
                : '1px solid var(--ds-card-border)',
              opacity: a.unlocked ? 1 : 0.25,
              filter: a.unlocked ? 'none' : 'grayscale(100%)',
              textAlign: 'center',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease',
              cursor: 'help',
              backdropFilter: 'blur(12px)',
            }}
            title={a.description}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 10px',
              borderRadius: '50%',
              background: a.unlocked
                ? 'var(--ds-color-warning-soft)'
                : 'var(--ds-bg-elevated)',
              border: a.unlocked
                ? '1px solid var(--ds-color-warning-border)'
                : '1px solid var(--ds-card-border)',
              boxShadow: a.unlocked
                ? '0 0 0 1px rgba(251, 191, 36, 0.20), 0 0 24px rgba(251, 191, 36, 0.22), 0 0 40px rgba(251, 191, 36, 0.10)'
                : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              transition: 'box-shadow 200ms ease',
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
              fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.4,
              minHeight: 24,
            }}>
              {a.description}
            </p>
            {a.unlocked && a.unlocked_at && (
              <p style={{ fontSize: 9, color: 'var(--ds-color-warning)', marginTop: 4, fontWeight: 600 }}>
                ✓ {new Date(a.unlocked_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
