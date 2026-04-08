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
      <div className="dash-anim-6 mb-6 card p-6">
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Cargando logros…</p>
      </div>
    )
  }

  if (!achievements.length) return null

  return (
    <>
      <AchievementToast achievements={newUnlocks} onAllDismissed={handleAllDismissed} />
      <div className="dash-anim-6 mb-6 card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Tus logros de crecimiento
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '4px 12px', borderRadius: 99,
            background: 'var(--ds-color-warning-soft)', color: 'var(--ds-color-warning)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            {unlockedCount} / {achievements.length} desbloqueados
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 18 }}>
          Cada hito que vas alcanzando mientras crece tu negocio
        </p>

        <div style={{
          display: 'flex', gap: 16, overflowX: 'auto',
          paddingBottom: 8, scrollbarWidth: 'thin',
        }}>
          {achievements.map(a => (
            <div key={a.id}
              title={`${a.name}${a.unlocked_at ? ` · ${new Date(a.unlocked_at).toLocaleDateString('es')}` : ''}: ${a.description}`}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                minWidth: 90,
                opacity: a.unlocked ? 1 : 0.30,
                filter: a.unlocked ? 'none' : 'grayscale(80%)',
                transition: 'all 0.2s',
                cursor: 'help',
              }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: a.unlocked
                  ? 'radial-gradient(circle at 38% 38%, rgba(245,158,11,0.30), rgba(245,158,11,0.05))'
                  : 'radial-gradient(circle at 38% 38%, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                border: a.unlocked ? '2px solid rgba(245,158,11,0.55)' : '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: a.unlocked ? '0 0 24px rgba(245,158,11,0.40), 0 0 48px rgba(245,158,11,0.15)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>
                {a.icon}
              </div>
              <p style={{
                fontSize: 10, fontWeight: 600, color: a.unlocked ? '#fff' : '#8892b0',
                textAlign: 'center', lineHeight: 1.3, maxWidth: 90,
              }}>
                {a.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
