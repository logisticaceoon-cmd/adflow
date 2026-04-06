'use client'
// src/components/dashboard/AchievementsWall.tsx
// Full grid wall of achievements (vs the horizontal scrollable AchievementsBadges)

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
}

interface Props {
  achievements: Achievement[]
}

export default function AchievementsWall({ achievements }: Props) {
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const pct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0

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
      <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 22 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          boxShadow: '0 0 12px rgba(245,158,11,0.50)',
          transition: 'width 0.8s ease',
        }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 16,
      }}>
        {achievements.map(a => (
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
              {a.title}
            </p>
            <p style={{
              fontSize: 10, color: 'var(--muted)', lineHeight: 1.4,
              minHeight: 24,
            }}>
              {a.description}
            </p>
            {a.unlocked && a.unlockedAt && (
              <p style={{ fontSize: 9, color: '#fbbf24', marginTop: 4, fontWeight: 600 }}>
                ✓ {new Date(a.unlockedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
