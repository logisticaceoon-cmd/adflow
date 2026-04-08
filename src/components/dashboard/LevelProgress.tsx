'use client'
// src/components/dashboard/LevelProgress.tsx — Progress bar to next level

interface Props {
  current: number
  required: number
  metric: string
  nextLevel: number
  currentColor?: string
  nextColor?: string
}

export default function LevelProgress({
  current, required, metric, nextLevel,
  currentColor = 'var(--ds-color-primary)', nextColor = 'var(--ds-color-success)',
}: Props) {
  const pct = Math.min(100, required > 0 ? Math.round((current / required) * 100) : 0)
  const dailyRate = current / 30
  const remaining = Math.max(0, required - current)
  const days = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null
  const timeMsg = days === null ? null
    : days <= 7  ? `~${days} días`
    : days <= 60 ? `~${Math.ceil(days / 7)} semanas`
    :              `~${Math.ceil(days / 30)} meses`

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, color: '#a0a8c0' }}>
          {current.toLocaleString()} de {required.toLocaleString()} <b style={{ color: '#fff' }}>{metric}</b> para nivel {nextLevel}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: nextColor }}>{pct}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${currentColor}, ${nextColor})`,
          boxShadow: `0 0 12px ${nextColor}50`,
          transition: 'width 0.7s ease',
        }} />
      </div>
      {pct < 20 && timeMsg && (
        <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 6 }}>
          A tu ritmo actual: {timeMsg} para llegar al próximo nivel
        </p>
      )}
      {pct >= 80 && (
        <p style={{ fontSize: 10, color: nextColor, marginTop: 6, fontWeight: 600 }}>
          ⚡ ¡Casi! Falta poco para subir de nivel
        </p>
      )}
    </div>
  )
}
