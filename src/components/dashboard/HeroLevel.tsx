'use client'
// src/components/dashboard/HeroLevel.tsx — The command center hero.
// The most important block on the page: premium glassmorphism with a
// subtle purple-green radial accent, full-width top light reflection,
// generous padding, and a dedicated progress bar with tip glow.

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
  monthSpend:      number
  monthSales:      number
  monthRoas:       number
  daysRemaining:   number
  hasPixel:        boolean
}

const LEVEL_ICONS: Record<number, string> = {
  0: '🌑', 1: '🌱', 2: '📚', 3: '🧠', 4: '🛒', 5: '💼', 6: '🚀', 7: '👑', 8: '🏰',
}

function roasColor(roas: number): string {
  if (roas >= 3)   return 'var(--ds-color-success)'
  if (roas >= 1.5) return 'var(--ds-color-warning)'
  if (roas > 0)    return 'var(--ds-color-danger)'
  return 'var(--ds-text-muted)'
}

export default function HeroLevel(p: Props) {
  const pct = p.metricRequired > 0
    ? Math.min(100, Math.round((p.metricCurrent / p.metricRequired) * 100))
    : 0

  const levelIcon = LEVEL_ICONS[p.level] || '🌑'

  const kpis: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Invertido',      value: `$${p.monthSpend.toFixed(0)}` },
    { label: 'Ventas',         value: String(p.monthSales), color: 'var(--ds-color-success)' },
    { label: 'ROAS',           value: p.monthRoas > 0 ? `${p.monthRoas.toFixed(1)}x` : '—', color: roasColor(p.monthRoas) },
    { label: 'Días restantes', value: String(p.daysRemaining) },
  ]

  return (
    <div className="card module-enter module-enter-1" style={{
      position: 'relative',
      marginBottom: 8,
      padding: '36px 40px',
      overflow: 'hidden',
    }}>
      {/* ── Top row: greeting (left) + KPIs strip (right) ─────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 32,
        alignItems: 'flex-start',
        marginBottom: p.hasPixel && p.level < 8 && p.metricRequired > 0 ? 28 : 0,
      }}>
        {/* Left: greeting + level line */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--ds-text-label)',
            marginBottom: 12,
          }}>
            Centro de mando · AdFlow
          </p>

          <h1 style={{
            fontFamily: 'Syne, system-ui, sans-serif',
            fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
            color: 'var(--ds-text-primary)', marginBottom: 12, lineHeight: 1.2,
          }}>
            Bienvenido, {p.fullName} 👋
          </h1>

          {p.hasPixel ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(45, 212, 168, 0.08)',
              border: '1px solid rgba(45, 212, 168, 0.22)',
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
        </div>

        {/* Right: KPI cards (stack on mobile via flexWrap) */}
        <div style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: '55%',
        }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'var(--ds-bg-elevated)',
              border: '1px solid var(--ds-card-border)',
              minWidth: 92,
            }}>
              <p style={{
                fontSize: 9, fontWeight: 700, color: 'var(--ds-text-label)',
                textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4,
              }}>
                {k.label}
              </p>
              <p style={{
                fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600,
                color: k.color || 'var(--ds-text-primary)',
                letterSpacing: '-0.01em', lineHeight: 1.1,
              }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress bar (only if hasPixel and level < 8) ─────────────── */}
      {p.hasPixel && p.level < 8 && p.metricRequired > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="progress-bar" style={{ height: 10, marginBottom: 12 }}>
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
