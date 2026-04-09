'use client'
// src/components/dashboard/AchievementToast.tsx
// Slide-in glassmorphism toast for newly unlocked achievements.
// Displays one-by-one with a 2s delay, 8s visible each.
import { useEffect, useState } from 'react'

export interface NewAchievement {
  id: string
  code: string
  name: string
  icon: string
  description: string
  rarity: string
}

interface Props {
  achievements: NewAchievement[]
  onAllDismissed?: () => void
}

const RARITY_META: Record<string, { stars: string; label: string; glow: string; border: string }> = {
  common:    { stars: '⭐',     label: 'Común',     glow: 'rgba(148,163,184,0.45)', border: 'rgba(148,163,184,0.55)' },
  rare:      { stars: '⭐⭐',   label: 'Raro',      glow: 'rgba(34, 211, 238,0.55)',  border: 'rgba(34, 211, 238,0.70)' },
  epic:      { stars: '⭐⭐⭐', label: 'Épico',     glow: 'rgba(168,85,247,0.60)',  border: 'rgba(168,85,247,0.75)' },
  legendary: { stars: '⭐⭐⭐⭐', label: 'Legendario', glow: 'rgba(245,158,11,0.70)',  border: 'rgba(245,158,11,0.85)' },
}

export default function AchievementToast({ achievements, onAllDismissed }: Props) {
  const [queue, setQueue] = useState<NewAchievement[]>([])
  const [current, setCurrent] = useState<NewAchievement | null>(null)
  const [visible, setVisible] = useState(false)

  // Initialize queue when new achievements arrive
  useEffect(() => {
    if (achievements.length > 0) {
      setQueue(achievements)
    }
  }, [achievements])

  // Drain queue one by one
  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent(next)
    setVisible(false)

    const showTimer = setTimeout(() => setVisible(true), 50)
    const hideTimer = setTimeout(() => setVisible(false), 8000)
    const nextTimer = setTimeout(() => {
      setCurrent(null)
      if (rest.length === 0) onAllDismissed?.()
    }, 8500 + 2000) // 8s visible + 0.5s fade + 2s delay

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(nextTimer)
    }
  }, [current, queue, onAllDismissed])

  if (!current) return null

  const rarity = RARITY_META[current.rarity] || RARITY_META.common

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setCurrent(null)
      if (queue.length === 0) onAllDismissed?.()
    }, 500)
  }

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 24,
        right: visible ? 24 : -420,
        zIndex: 9999,
        width: 360,
        transition: 'right 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, rgba(20,22,40,0.88), rgba(10,12,24,0.94))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1.5px solid ${rarity.border}`,
          borderRadius: 18,
          padding: '18px 20px',
          boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 40px ${rarity.glow}, 0 0 80px ${rarity.glow}`,
          animation: 'achievementGlow 2.4s ease-in-out infinite',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 12, fontWeight: 700, color: 'var(--ds-color-warning)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            margin: 0,
          }}>
            ¡Nuevo logro desbloqueado!
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            width: 56, height: 56, flexShrink: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 38%, ${rarity.glow}, rgba(255,255,255,0.02))`,
            border: `2px solid ${rarity.border}`,
            boxShadow: `0 0 24px ${rarity.glow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            {current.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 16, fontWeight: 800, color: '#fff',
              margin: '0 0 4px',
              lineHeight: 1.2,
            }}>
              {current.name}
            </p>
            <p style={{
              fontSize: 11, color: 'var(--ds-text-secondary)', margin: 0, lineHeight: 1.4,
            }}>
              {current.description}
            </p>
          </div>
        </div>

        {/* Rarity */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
            Rareza: <span style={{ color: '#fff', fontWeight: 700 }}>{rarity.stars} {rarity.label}</span>
          </span>
          <button
            onClick={handleDismiss}
            style={{
              background: 'var(--ds-color-warning-soft)',
              border: '1px solid var(--ds-color-warning-border)',
              color: 'var(--ds-color-warning)',
              fontSize: 11, fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 99,
              cursor: 'pointer',
            }}
          >
            ¡Genial! ✨
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes achievementGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
      `}</style>
    </div>
  )
}
