'use client'
// src/components/dashboard/LevelBadge.tsx — Visual level badge

interface Props {
  level: number
  levelName?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#8892b0',
  1: 'var(--ds-color-danger)', 2: 'var(--ds-color-danger)',
  3: 'var(--ds-color-warning)', 4: 'var(--ds-color-warning)',
  5: 'var(--ds-color-success)', 6: 'var(--ds-color-success)',
  7: '#3b82f6',
  8: '#8b5cf6',
}

const SIZE_PX: Record<'sm' | 'md' | 'lg', { box: number; num: number; name: number }> = {
  sm: { box: 32, num: 13, name: 10 },
  md: { box: 56, num: 22, name: 12 },
  lg: { box: 96, num: 38, name: 14 },
}

export default function LevelBadge({ level, levelName, size = 'md', showName = true }: Props) {
  const color = LEVEL_COLORS[level] ?? '#8892b0'
  const dim = SIZE_PX[size]
  const isMax = level === 8

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        className={isMax ? 'level-badge-pulse' : ''}
        style={{
          width: dim.box, height: dim.box, borderRadius: '50%',
          background: `radial-gradient(circle at 38% 38%, ${color}40, ${color}10)`,
          border: `2px solid ${color}80`,
          boxShadow: `0 0 ${dim.box / 2}px ${color}55, 0 0 ${dim.box}px ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: dim.num, fontWeight: 900, color,
          fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.04em',
        }}>
        {level}
      </div>
      {showName && levelName && (
        <span style={{ fontSize: dim.name, fontWeight: 700, color, textAlign: 'center' }}>
          {levelName}
        </span>
      )}
      <style>{`
        @keyframes lvlPulse {
          0%, 100% { box-shadow: 0 0 ${dim.box / 2}px ${color}80, 0 0 ${dim.box}px ${color}40; }
          50%      { box-shadow: 0 0 ${dim.box}px ${color}aa, 0 0 ${dim.box * 2}px ${color}55; }
        }
        .level-badge-pulse { animation: lvlPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
