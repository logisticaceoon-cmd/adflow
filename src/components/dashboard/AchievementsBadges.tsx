'use client'
// src/components/dashboard/AchievementsBadges.tsx
// Horizontal scrollable badge gallery — unlocked badges glow, locked are dimmed

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

export default function AchievementsBadges({ achievements }: Props) {
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="dash-anim-6 mb-6 card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          Tus logros de crecimiento
        </h2>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '4px 12px', borderRadius: 99,
          background: 'rgba(245,158,11,0.10)', color: '#fbbf24',
          border: '1px solid rgba(245,158,11,0.30)',
        }}>
          {unlockedCount} / {achievements.length} desbloqueados
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
        Cada hito que vas alcanzando mientras crece tu negocio
      </p>

      <div style={{
        display: 'flex', gap: 16, overflowX: 'auto',
        paddingBottom: 8, scrollbarWidth: 'thin',
      }}>
        {achievements.map(a => (
          <div key={a.id}
            title={`${a.title}${a.unlockedAt ? ` · ${new Date(a.unlockedAt).toLocaleDateString('es')}` : ''}: ${a.description}`}
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
              {a.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
