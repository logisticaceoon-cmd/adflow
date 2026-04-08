// src/components/intelligence/DiagnosticBadge.tsx
// Visual badge that surfaces the strategic diagnosis for a campaign.
import { ROAS_LEVEL_LABEL, FREQUENCY_LEVEL_LABEL, type RoasLevel, type FrequencyLevel } from '@/lib/strategy-settings'

export type DiagnosticType = 'Escalar' | 'Optimizar' | 'Pausar' | 'Observar' | 'Sin datos'

interface Props {
  diagnosticType: DiagnosticType
  ruleId?: string | null
  ruleLabel?: string | null
  roasLevel: RoasLevel | string
  frequencyLevel: FrequencyLevel | string
}

const CONFIG: Record<DiagnosticType, { icon: string; bg: string; border: string; color: string }> = {
  Escalar:    { icon: '📈', bg: 'var(--ds-color-success-soft)', border: 'var(--ds-color-success-border)', color: 'var(--ds-color-success)' },
  Optimizar:  { icon: '🔧', bg: 'var(--ds-color-warning-soft)', border: 'var(--ds-color-warning-border)', color: 'var(--ds-color-warning)' },
  Pausar:     { icon: '⏸',  bg: 'var(--ds-color-danger-soft)',  border: 'var(--ds-color-danger-border)',  color: 'var(--ds-color-danger)' },
  Observar:   { icon: '👁', bg: 'var(--ds-color-primary-soft)', border: 'var(--ds-color-primary-border)', color: 'var(--ds-color-primary)' },
  'Sin datos':{ icon: '📊', bg: 'var(--ds-bg-elevated)',        border: 'var(--ds-card-border)',          color: 'var(--ds-text-muted)' },
}

export default function DiagnosticBadge({ diagnosticType, ruleId, ruleLabel, roasLevel, frequencyLevel }: Props) {
  const cfg = CONFIG[diagnosticType] || CONFIG['Sin datos']
  const roasLabel = ROAS_LEVEL_LABEL[roasLevel as RoasLevel] || roasLevel
  const freqLabel = FREQUENCY_LEVEL_LABEL[frequencyLevel as FrequencyLevel] || frequencyLevel

  const tooltip = ruleId
    ? `Regla ${ruleId}${ruleLabel ? ` · ${ruleLabel}` : ''}`
    : 'Diagnóstico basado en heurística general'

  return (
    <div
      title={tooltip}
      style={{
        padding: 'var(--ds-space-lg)',
        borderRadius: 'var(--ds-card-radius)',
        background: 'var(--ds-card-bg)',
        border: '1px solid var(--ds-card-border)',
        backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
        WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
        boxShadow: 'var(--ds-shadow-sm)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
        textTransform: 'uppercase', color: 'var(--ds-text-label)',
      }}>
        Diagnóstico
      </p>

      {/* Main pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '10px 18px',
        borderRadius: 99,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        width: 'fit-content',
      }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.icon}</span>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 15, fontWeight: 700, color: cfg.color,
          letterSpacing: '-0.01em',
        }}>
          {diagnosticType}
        </span>
      </div>

      {/* Sublabels — roas level + frequency level */}
      <div style={{
        display: 'flex', gap: 16, fontSize: 11,
        color: 'var(--ds-text-secondary)', flexWrap: 'wrap',
      }}>
        <span>
          ROAS: <strong style={{ color: 'var(--ds-text-primary)' }}>{roasLabel}</strong>
        </span>
        <span>
          Frecuencia: <strong style={{ color: 'var(--ds-text-primary)' }}>{freqLabel}</strong>
        </span>
      </div>

      {ruleId && (
        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>
          Regla activa: <code style={{ color: 'var(--ds-color-primary)' }}>{ruleId}</code>
          {ruleLabel && <span> · {ruleLabel}</span>}
        </p>
      )}
    </div>
  )
}
