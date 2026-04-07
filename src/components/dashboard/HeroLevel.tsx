'use client'
// src/components/dashboard/HeroLevel.tsx — Hero block: greeting + level + monthly snapshot
// Migrated to unified design system. Same content + behavior, sober palette.

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

function roasStatus(roas: number): string {
  if (roas >= 3)   return 'var(--ds-color-success)'
  if (roas >= 1.5) return 'var(--ds-color-warning)'
  if (roas > 0)    return 'var(--ds-color-danger)'
  return 'var(--ds-text-muted)'
}

export default function HeroLevel(p: Props) {
  const pct = p.metricRequired > 0
    ? Math.min(100, Math.round((p.metricCurrent / p.metricRequired) * 100))
    : 0

  return (
    <div className="dash-anim-1" style={{
      marginBottom: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      padding: 'var(--ds-space-xl)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
      boxShadow: 'var(--ds-shadow-md)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── LEFT 2/3: greeting + level + progress ── */}
        <div className="md:col-span-2">
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'var(--ds-text-label)',
            marginBottom: 8,
          }}>
            Centro de mando · AdFlow
          </p>
          <h1 style={{
            fontFamily: 'Syne, system-ui, sans-serif',
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--ds-text-primary)', marginBottom: 12, lineHeight: 1.15,
          }}>
            Bienvenido, {p.fullName} 👋
          </h1>

          {p.hasPixel ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>Tu negocio está en</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 99,
                  background: 'var(--ds-color-primary-soft)',
                  border: '1px solid var(--ds-color-primary-border)',
                  color: 'var(--ds-color-primary)',
                  fontSize: 12, fontWeight: 700,
                }}>
                  NIVEL {p.level} · {p.levelName}
                </span>
              </div>

              {p.level < 8 && p.metricRequired > 0 && (
                <>
                  <div style={{
                    height: 8, borderRadius: 99,
                    background: 'rgba(255,255,255,0.05)',
                    overflow: 'hidden', marginBottom: 8,
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: 'var(--ds-color-primary)',
                      transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      borderRadius: 99,
                    }} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 6 }}>
                    <b style={{ color: 'var(--ds-text-primary)' }}>{p.metricCurrent.toLocaleString()}</b> de{' '}
                    <b style={{ color: 'var(--ds-text-primary)' }}>{p.metricRequired.toLocaleString()}</b>{' '}
                    {p.metricLabel} para llegar a <b style={{ color: 'var(--ds-color-primary)' }}>nivel {p.nextLevel}: {p.nextLevelName}</b>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
                    Cuando subas al siguiente nivel, desbloquearás {p.unlockTeaser}.
                  </p>
                </>
              )}
              {p.level >= 8 && (
                <p style={{ fontSize: 14, color: 'var(--ds-color-primary)' }}>
                  👑 Estás en el nivel máximo. Seguí escalando lo que ya funciona.
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)' }}>
              Configurá tu pixel para empezar a medir el crecimiento de tu negocio.{' '}
              <a href="/dashboard/settings" style={{ color: 'var(--ds-color-primary)', textDecoration: 'underline' }}>
                Ir a configuración →
              </a>
            </p>
          )}
        </div>

        {/* ── RIGHT 1/3: monthly snapshot ── */}
        <div style={{
          padding: 'var(--ds-space-lg)',
          borderRadius: 'var(--ds-card-radius-sm)',
          background: 'var(--ds-bg-elevated)',
          border: '1px solid var(--ds-card-border)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'var(--ds-text-label)',
          }}>
            Este mes
          </p>
          <div>
            <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>Invertido</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--ds-text-primary)' }}>
              ${p.monthSpend.toFixed(0)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>Ventas</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ds-color-success)' }}>{p.monthSales}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>ROAS</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: roasStatus(p.monthRoas) }}>
                {p.monthRoas > 0 ? `${p.monthRoas.toFixed(1)}x` : '—'}
              </p>
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 99,
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid var(--ds-color-primary-border)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ds-color-primary)' }}>
              {p.daysRemaining} días restantes del mes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
