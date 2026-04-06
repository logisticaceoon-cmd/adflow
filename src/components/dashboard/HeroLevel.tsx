'use client'
// src/components/dashboard/HeroLevel.tsx — Hero block: greeting + level + monthly snapshot

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

const LEVEL_COLORS: Record<number, { from: string; to: string; text: string }> = {
  0: { from: '#8892b0', to: '#5a6478', text: '#a0a8c0' },
  1: { from: '#ef4444', to: '#dc2626', text: '#fca5a5' },
  2: { from: '#ef4444', to: '#dc2626', text: '#fca5a5' },
  3: { from: '#f59e0b', to: '#d97706', text: '#fbbf24' },
  4: { from: '#f59e0b', to: '#d97706', text: '#fbbf24' },
  5: { from: '#06d6a0', to: '#059669', text: '#6ee7b7' },
  6: { from: '#06d6a0', to: '#059669', text: '#6ee7b7' },
  7: { from: '#3b82f6', to: '#2563eb', text: '#93c5fd' },
  8: { from: '#8b5cf6', to: '#7c3aed', text: '#c4b5fd' },
}

export default function HeroLevel(p: Props) {
  const lc = LEVEL_COLORS[p.level] ?? LEVEL_COLORS[0]
  const nlc = LEVEL_COLORS[p.nextLevel] ?? LEVEL_COLORS[0]
  const pct = p.metricRequired > 0
    ? Math.min(100, Math.round((p.metricCurrent / p.metricRequired) * 100))
    : 0

  return (
    <div className="dash-anim-1 mb-6" style={{
      borderRadius: 22, padding: '28px 32px',
      background: 'linear-gradient(135deg, rgba(233,30,140,0.10) 0%, rgba(98,196,176,0.06) 50%, rgba(233,30,140,0.04) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.50), 0 0 80px rgba(234,27,126,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(234,27,126,0.55), rgba(98,196,176,0.40), transparent)',
      }} />

      <div className="grid grid-cols-3 gap-8">
        {/* ── LEFT 2/3: greeting + level + progress ── */}
        <div className="col-span-2">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f9a8d4', marginBottom: 8 }}>
            Centro de mando · AdFlow
          </p>
          <h1 style={{
            fontFamily: 'Syne, system-ui, sans-serif',
            fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em',
            color: '#ffffff', marginBottom: 10, lineHeight: 1.1,
          }}>
            Bienvenido, {p.fullName} 👋
          </h1>

          {p.hasPixel ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>Tu negocio está en</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 99,
                  background: `linear-gradient(135deg, ${lc.from}25, ${lc.from}10)`,
                  border: `1px solid ${lc.from}50`,
                  boxShadow: `0 0 16px ${lc.from}30`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: lc.text }}>
                    NIVEL {p.level}
                  </span>
                  <span style={{ fontSize: 12, color: lc.text }}>·</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: lc.text }}>
                    {p.levelName}
                  </span>
                </span>
              </div>

              {p.level < 8 && p.metricRequired > 0 && (
                <>
                  <div style={{
                    height: 12, borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    overflow: 'hidden', marginBottom: 8,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: `linear-gradient(90deg, ${lc.from}, ${nlc.from})`,
                      boxShadow: `0 0 16px ${nlc.from}80`,
                      transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      borderRadius: 8,
                    }} />
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 6 }}>
                    <b style={{ color: '#ffffff' }}>{p.metricCurrent.toLocaleString()}</b> de{' '}
                    <b style={{ color: '#ffffff' }}>{p.metricRequired.toLocaleString()}</b>{' '}
                    {p.metricLabel} para llegar a <b style={{ color: nlc.text }}>nivel {p.nextLevel}: {p.nextLevelName}</b>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                    Cuando subas al siguiente nivel, desbloquearás {p.unlockTeaser}.
                  </p>
                </>
              )}
              {p.level >= 8 && (
                <p style={{ fontSize: 14, color: '#c4b5fd' }}>
                  👑 Estás en el nivel máximo. Seguí escalando lo que ya funciona.
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
              Configurá tu pixel para empezar a medir el crecimiento de tu negocio.{' '}
              <a href="/dashboard/settings" style={{ color: '#f9a8d4', textDecoration: 'underline' }}>
                Ir a configuración →
              </a>
            </p>
          )}
        </div>

        {/* ── RIGHT 1/3: monthly snapshot ── */}
        <div style={{
          padding: '20px 20px',
          borderRadius: 16,
          background: 'rgba(0,0,0,0.30)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8892b0' }}>
            Este mes
          </p>
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Invertido</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              ${p.monthSpend.toFixed(0)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Ventas</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#06d6a0' }}>{p.monthSales}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>ROAS</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: p.monthRoas >= 3 ? '#06d6a0' : p.monthRoas >= 1.5 ? '#f59e0b' : '#ef4444' }}>
                {p.monthRoas > 0 ? `${p.monthRoas.toFixed(1)}x` : '—'}
              </p>
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 99,
            background: 'rgba(98,196,176,0.10)',
            border: '1px solid rgba(98,196,176,0.25)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#62c4b0' }}>
              {p.daysRemaining} días restantes del mes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
