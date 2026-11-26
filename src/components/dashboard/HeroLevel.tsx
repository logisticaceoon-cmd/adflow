'use client'
// src/components/dashboard/HeroLevel.tsx — Welcome + Level + Progress
// Clean hero: no KPIs (those live in MonthSummary to avoid duplication).

interface Props {
  fullName:        string
  level:           number
  levelName:       string
  metricCurrent:   number
  metricRequired:  number
  metricLabel:     string
  nextLevel:       number
  nextLevelName:   string
  unlockTeaser:    string
  hasPixel:        boolean
}

const LEVEL_ICONS: Record<number, string> = {
  0: '🌑', 1: '🌱', 2: '📚', 3: '🧠', 4: '🛒', 5: '💼', 6: '🚀', 7: '👑', 8: '🏰',
}

export default function HeroLevel(p: Props) {
  const pct = p.metricRequired > 0
    ? Math.min(100, Math.round((p.metricCurrent / p.metricRequired) * 100))
    : 0

  const levelIcon = LEVEL_ICONS[p.level] || '🌑'

  return (
    <div className="card module-enter module-enter-1" style={{
      position: 'relative',
      marginBottom: 8,
      padding: '32px 36px',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ds-text-label)',
        marginBottom: 12,
      }}>
        Centro de mando · AdFlow
      </p>

      <h1 style={{
        fontFamily: 'var(--font-display), Space Grotesk, sans-serif',
        fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
        color: 'var(--ds-text-primary)', marginBottom: 14, lineHeight: 1.2,
      }}>
        Bienvenido, {p.fullName} 👋
      </h1>

      {p.hasPixel ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.22)',
        }}>
          <span style={{ fontSize: 14 }}>{levelIcon}</span>
          <span style={{
            fontSize: 15, fontWeight: 600,
            color: 'var(--ds-color-primary)',
            letterSpacing: '-0.01em',
          }}>
            Nivel {p.level}: {p.levelName}
          </span>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)' }}>
          Configurá tu pixel para empezar a medir el crecimiento.{' '}
          <a href="/dashboard/settings" style={{ color: 'var(--ds-color-primary)', textDecoration: 'underline' }}>
            Ir a configuración →
          </a>
        </p>
      )}

      {/* ── Progress bar (only if hasPixel and level < 8) ── */}
      {p.hasPixel && p.level < 8 && p.metricRequired > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="progress-bar" style={{ height: 8, marginBottom: 10 }}>
            <div
              className="progress-bar-fill progress-animated"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--ds-text-primary)', fontWeight: 600 }}>
              {p.metricCurrent.toLocaleString()}
            </strong>
            {' '}de{' '}
            <strong style={{ color: 'var(--ds-text-primary)', fontWeight: 600 }}>
              {p.metricRequired.toLocaleString()}
            </strong>
            {' '}{p.metricLabel} para{' '}
            <strong style={{ color: 'var(--ds-color-primary)', fontWeight: 600 }}>
              Nivel {p.nextLevel}: {p.nextLevelName}
            </strong>
          </p>
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            Cuando subas desbloquearás {p.unlockTeaser}.
          </p>
        </div>
      )}

      {p.hasPixel && p.level >= 8 && (
        <p style={{ fontSize: 14, color: 'var(--ds-color-primary)', marginTop: 18 }}>
          👑 Estás en el nivel máximo. Seguí escalando lo que ya funciona.
        </p>
      )}
    </div>
  )
}
