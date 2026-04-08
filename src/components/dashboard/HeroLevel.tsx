'use client'
// src/components/dashboard/HeroLevel.tsx — The command center hero.
// Dominates ~25% of the initial viewport. No decorative competition,
// no heavy gradients, no redundant badges. Just the state of the business.

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

  // Compact KPI strip (inline, 4 items)
  const kpis: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Invertido',      value: `$${p.monthSpend.toFixed(0)}` },
    { label: 'Ventas',         value: String(p.monthSales), color: 'var(--ds-color-success)' },
    { label: 'ROAS',           value: p.monthRoas > 0 ? `${p.monthRoas.toFixed(1)}x` : '—', color: roasColor(p.monthRoas) },
    { label: 'Días restantes', value: String(p.daysRemaining) },
  ]

  return (
    <div className="dash-anim-1" style={{
      marginBottom: 8,
      borderRadius: 'var(--ds-card-radius)',
      padding: '32px 36px',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-md)',
      position: 'relative',
    }}>
      {/* Overline */}
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ds-text-label)',
        marginBottom: 10,
      }}>
        Centro de mando · AdFlow
      </p>

      {/* Greeting */}
      <h1 style={{
        fontFamily: 'Syne, system-ui, sans-serif',
        fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em',
        color: 'var(--ds-text-primary)', marginBottom: 10, lineHeight: 1.2,
      }}>
        Bienvenido, {p.fullName} 👋
      </h1>

      {/* Level line */}
      {p.hasPixel ? (
        <p style={{ fontSize: 16, color: 'var(--ds-text-secondary)', marginBottom: 22, lineHeight: 1.4 }}>
          Tu negocio está en{' '}
          <strong style={{ color: 'var(--ds-color-primary)', fontWeight: 700 }}>
            Nivel {p.level}: {p.levelName}
          </strong>
        </p>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', marginBottom: 22 }}>
          Configurá tu pixel para empezar a medir el crecimiento de tu negocio.{' '}
          <a href="/dashboard/settings" style={{ color: 'var(--ds-color-primary)', textDecoration: 'underline' }}>
            Ir a configuración →
          </a>
        </p>
      )}

      {/* Progress bar (only if hasPixel and level < 8) */}
      {p.hasPixel && p.level < 8 && p.metricRequired > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{
            height: 10, borderRadius: 99,
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            border: '1px solid var(--ds-card-border)',
          }}>
            <div
              className="progress-bar-fill"
              style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--ds-color-primary) 0%, rgba(96, 165, 250, 0.25) 100%)',
                boxShadow: '0 0 16px rgba(96, 165, 250, 0.35)',
                borderRadius: 99,
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginTop: 10, lineHeight: 1.4 }}>
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
          <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', marginTop: 6, fontStyle: 'italic' }}>
            Cuando subas desbloquearás {p.unlockTeaser}.
          </p>
        </div>
      )}

      {p.hasPixel && p.level >= 8 && (
        <p style={{ fontSize: 14, color: 'var(--ds-color-primary)', marginBottom: 22 }}>
          👑 Estás en el nivel máximo. Seguí escalando lo que ya funciona.
        </p>
      )}

      {/* Compact KPI strip */}
      <div style={{
        display: 'flex',
        gap: 32,
        paddingTop: 18,
        borderTop: '1px solid var(--ds-card-border)',
        flexWrap: 'wrap',
      }}>
        {kpis.map(k => (
          <div key={k.label} style={{ flex: '1 1 auto', minWidth: 80 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: 'var(--ds-text-label)',
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
  )
}
