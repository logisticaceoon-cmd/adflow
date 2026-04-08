// src/components/intelligence/RiskIndicator.tsx
// Horizontal 4-segment bar that surfaces the risk level visually.
interface Props {
  riskLevel: string
  motivo: string
}

type RiskTier = 'OK' | 'MODERADO' | 'ALTO' | 'CRITICO'

const RISK_TO_TIER: Record<string, RiskTier> = {
  OK:              'OK',
  FRECUENCIA_ALTA: 'MODERADO',
  ROAS_BAJO:       'MODERADO',
  SIN_VOLUMEN:     'MODERADO',
  EMBUDO_ROTO:     'ALTO',
  DOBLE_ALERTA:    'CRITICO',
}

const TIER_META: Record<RiskTier, { label: string; color: string; index: number }> = {
  OK:       { label: 'Sin riesgo',    color: 'var(--ds-color-success)', index: 0 },
  MODERADO: { label: 'Riesgo moderado', color: 'var(--ds-color-warning)', index: 1 },
  ALTO:     { label: 'Riesgo alto',   color: '#f59e0b',                 index: 2 },
  CRITICO:  { label: 'Riesgo crítico',color: 'var(--ds-color-danger)',  index: 3 },
}

const SEGMENTS: Array<{ tier: RiskTier; color: string }> = [
  { tier: 'OK',       color: 'var(--ds-color-success)' },
  { tier: 'MODERADO', color: 'var(--ds-color-warning)' },
  { tier: 'ALTO',     color: '#f59e0b' },
  { tier: 'CRITICO',  color: 'var(--ds-color-danger)' },
]

export default function RiskIndicator({ riskLevel, motivo }: Props) {
  const tier = RISK_TO_TIER[riskLevel] || 'OK'
  const meta = TIER_META[tier]

  return (
    <div style={{
      padding: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
        }}>
          Nivel de riesgo
        </p>
        <span style={{
          fontSize: 12, fontWeight: 700, color: meta.color,
        }}>
          {meta.label}
        </span>
      </div>

      {/* 4-segment bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
      }}>
        {SEGMENTS.map((seg, i) => {
          const active = i <= meta.index
          return (
            <div key={seg.tier} style={{
              flex: 1,
              height: 8,
              borderRadius: 99,
              background: active ? seg.color : 'rgba(255, 255, 255, 0.05)',
              boxShadow: active ? `0 0 12px ${seg.color}55` : 'none',
              transition: 'all var(--ds-transition-normal)',
            }} />
          )
        })}
      </div>

      {/* Segment labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        {SEGMENTS.map((seg, i) => (
          <span key={seg.tier} style={{
            fontSize: 9, color: i <= meta.index ? 'var(--ds-text-primary)' : 'var(--ds-text-muted)',
            fontWeight: i <= meta.index ? 600 : 400,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {seg.tier}
          </span>
        ))}
      </div>

      {/* Motivo */}
      <p style={{
        fontSize: 12, color: 'var(--ds-text-secondary)',
        lineHeight: 1.5,
        padding: '10px 12px',
        background: 'var(--ds-bg-elevated)',
        border: '1px solid var(--ds-card-border)',
        borderRadius: 'var(--ds-card-radius-sm)',
      }}>
        {motivo}
      </p>
    </div>
  )
}
