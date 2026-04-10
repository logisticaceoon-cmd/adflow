'use client'
// src/components/admin/CountryWidget.tsx

export type CountryData = { country: string; count: number; pct: number }

const COLORS = ['#2dd4a8', '#62c4b0', '#f472b6', '#f59e0b', '#2dd4a8', '#8892b0']

const FLAG: Record<string, string> = {
  AR: '🇦🇷', CO: '🇨🇴', CL: '🇨🇱', MX: '🇲🇽', PE: '🇵🇪',
  VE: '🇻🇪', UY: '🇺🇾', EC: '🇪🇨', BR: '🇧🇷', ES: '🇪🇸',
  US: '🇺🇸', GT: '🇬🇹', BO: '🇧🇴', PY: '🇵🇾', PA: '🇵🇦',
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', CO: 'Colombia', CL: 'Chile', MX: 'México', PE: 'Perú',
  VE: 'Venezuela', UY: 'Uruguay', EC: 'Ecuador', BR: 'Brasil', ES: 'España',
  US: 'Estados Unidos', GT: 'Guatemala', BO: 'Bolivia', PY: 'Paraguay', PA: 'Panamá',
}

export default function CountryWidget({ data }: { data: CountryData[] }) {
  const hasData = data.length > 0

  return (
    <div style={{
      background: 'rgba(18,4,10,0.96)',
      border: '1px solid rgba(98,196,176,0.14)',
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 24,
      animation: 'adminFadeUp 0.7s ease-out 0.5s both',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(98,196,176,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#62c4b0',
            boxShadow: '0 0 8px rgba(98,196,176,0.7)',
            animation: 'kpiGlowPulse 2.5s ease-in-out infinite',
          }} />
          <h2 style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: '#6b6b8a',
          }}>
            Distribución por país
          </h2>
        </div>

        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: hasData ? 'rgba(98,196,176,0.12)' : 'rgba(90,90,122,0.15)',
          color: hasData ? '#62c4b0' : '#8892b0',
          border: `1px solid ${hasData ? 'rgba(98,196,176,0.3)' : 'rgba(255,255,255,0.12)'}`,
          padding: '3px 10px', borderRadius: 20,
        }}>
          {hasData ? `${data.length} países` : 'Sin datos'}
        </span>
      </div>

      {/* Content */}
      {hasData ? (
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((d, i) => (
            <div key={d.country} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{FLAG[d.country] ?? '🌍'}</span>
              <span style={{ fontSize: 13, color: '#9ca3af', width: 130, flexShrink: 0 }}>
                {COUNTRY_NAMES[d.country] ?? d.country}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 3,
                  background: COLORS[i % COLORS.length],
                  width: `${d.pct}%`,
                  boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}60`,
                  transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: COLORS[i % COLORS.length],
                width: 38, textAlign: 'right', flexShrink: 0,
              }}>
                {d.pct}%
              </span>
              <span style={{
                fontSize: 11, color: '#8892b0',
                width: 32, textAlign: 'right', flexShrink: 0,
              }}>
                {d.count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🌎</div>
          <p style={{ color: '#8892b0', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Datos geográficos no configurados
          </p>
          <p style={{ color: '#8892b0', fontSize: 12, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
            Para activar esta métrica, ejecutá en Supabase SQL Editor:
          </p>
          <div style={{
            margin: '12px auto 0',
            maxWidth: 480,
            background: 'rgba(14,4,8,0.97)',
            border: '1px solid rgba(98,196,176,0.16)',
            borderRadius: 10,
            padding: '10px 16px',
            textAlign: 'left',
          }}>
            <code style={{
              fontFamily: 'monospace', fontSize: 11, color: '#62c4b0',
              lineHeight: 1.8, display: 'block', whiteSpace: 'pre-wrap',
            }}>
              {`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT;`}
            </code>
          </div>
          <p style={{ color: '#8892b0', fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>
            Luego poblá la columna al registrar usuarios (por IP, timezone o preferencia).
          </p>
        </div>
      )}
    </div>
  )
}
