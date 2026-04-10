'use client'
// src/components/dashboard/AchievementsBadges.tsx
// Horizontal scrollable badge gallery. Fetches persistent achievements from /api/achievements.
// Shows a toast for any newly-unlocked (notified=false) achievements and marks them notified.
import { useEffect, useState } from 'react'
import AchievementToast, { type NewAchievement } from './AchievementToast'

interface ApiAchievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  rarity: string
  unlocked: boolean
  unlocked_at: string | null
  notified: boolean
}

export default function AchievementsBadges() {
  const [achievements, setAchievements] = useState<ApiAchievement[]>([])
  const [newUnlocks, setNewUnlocks] = useState<NewAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/achievements')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setAchievements(data.achievements || [])
        const nu: NewAchievement[] = (data.newUnlocks || []).map((a: ApiAchievement) => ({
          id: a.id, code: a.code, name: a.name, icon: a.icon, description: a.description, rarity: a.rarity,
        }))
        setNewUnlocks(nu)
      })
      .catch(() => { /* fail silently, widget just stays empty */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleAllDismissed = async () => {
    if (!newUnlocks.length) return
    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_notified', achievement_ids: newUnlocks.map(a => a.id) }),
      })
    } catch { /* ignore */ }
    setNewUnlocks([])
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Cargando logros…</p>
      </div>
    )
  }

  if (!achievements.length) return null

  // Pick 6: the last unlocked + the next 2 locked (most actionable)
  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)
  const display = [
    ...unlocked.slice(-4),
    ...locked.slice(0, 6 - Math.min(4, unlocked.length)),
  ].slice(0, 6)

  return (
    <>
      <AchievementToast achievements={newUnlocks} onAllDismissed={handleAllDismissed} />
      <div className="card module-enter module-enter-6" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16, fontWeight: 600,
            color: 'var(--ds-text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Logros
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 99,
            background: 'var(--ds-color-warning-soft)',
            color: 'var(--ds-color-warning)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            {unlockedCount} / {achievements.length}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 16 }}>
          Hitos recientes y próximos
        </p>

        {/* 3 × 2 compact grid, no horizontal scroll */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 14,
        }}>
          {display.map(a => (
            <div key={a.id}
              className="achievement-item"
              title={`${a.name}${a.unlocked_at ? ` · ${new Date(a.unlocked_at).toLocaleDateString('es')}` : ''}: ${a.description}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                opacity: a.unlocked ? 1 : 0.25,
                filter: a.unlocked ? 'none' : 'grayscale(100%)',
                cursor: 'help',
                transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: a.unlocked
                  ? 'var(--ds-color-warning-soft)'
                  : 'var(--ds-bg-elevated)',
                border: a.unlocked
                  ? '1px solid var(--ds-color-warning-border)'
                  : '1px solid var(--ds-card-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>
                {a.icon}
              </div>
              <p style={{
                fontSize: 10, fontWeight: 600,
                color: a.unlocked ? 'var(--ds-text-primary)' : 'var(--ds-text-muted)',
                textAlign: 'center', lineHeight: 1.25,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
              }}>
                {a.name}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop: 12,
          borderTop: '1px solid var(--ds-card-border)',
          textAlign: 'right',
        }}>
          <a href="/dashboard/pixel" style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--ds-color-primary)',
            textDecoration: 'none',
          }}>
            Ver todos los logros →
          </a>
        </div>
      </div>
    </>
  )
}
