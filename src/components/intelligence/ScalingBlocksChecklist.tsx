// src/components/intelligence/ScalingBlocksChecklist.tsx
// Visualizes the 4 scaling evaluation blocks as a checklist + final decision.
import { Check, X } from 'lucide-react'

interface Props {
  bloqueA: boolean        // ROAS sufficient
  bloqueB: boolean        // Frequency healthy
  bloqueC: boolean        // Volume sufficient
  bloqueCplus: boolean    // Funnel healthy
  bloqueCfinal: boolean   // C AND C+
  canScale: boolean
  scalePctSuggested: number
  riskLevel: string
  motivo?: string
}

interface BlockRow {
  id: 'A' | 'B' | 'C' | 'Cplus'
  label: string
  description: string
  passed: boolean
}

const RISK_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  OK:               { label: 'Sin riesgo',       bg: 'var(--ds-color-success-soft)', color: 'var(--ds-color-success)', border: 'var(--ds-color-success-border)' },
  FRECUENCIA_ALTA:  { label: 'Frecuencia alta',  bg: 'var(--ds-color-warning-soft)', color: 'var(--ds-color-warning)', border: 'var(--ds-color-warning-border)' },
  ROAS_BAJO:        { label: 'ROAS bajo',        bg: 'var(--ds-color-warning-soft)', color: 'var(--ds-color-warning)', border: 'var(--ds-color-warning-border)' },
  EMBUDO_ROTO:      { label: 'Embudo roto',      bg: 'var(--ds-color-warning-soft)', color: 'var(--ds-color-warning)', border: 'var(--ds-color-warning-border)' },
  SIN_VOLUMEN:      { label: 'Sin volumen',      bg: 'var(--ds-bg-elevated)',        color: 'var(--ds-text-secondary)', border: 'var(--ds-card-border)' },
  DOBLE_ALERTA:     { label: 'Doble alerta',     bg: 'var(--ds-color-danger-soft)',  color: 'var(--ds-color-danger)',  border: 'var(--ds-color-danger-border)' },
}

export default function ScalingBlocksChecklist({
  bloqueA, bloqueB, bloqueC, bloqueCplus, bloqueCfinal,
  canScale, scalePctSuggested, riskLevel, motivo,
}: Props) {
  const rows: BlockRow[] = [
    { id: 'A',     label: 'Bloque A · ROAS suficiente',    description: 'ROAS debe ser ≥ 4x (mínimo rentable)', passed: bloqueA },
    { id: 'B',     label: 'Bloque B · Frecuencia saludable', description: 'Frecuencia debe ser < 4 (audiencia no saturada)', passed: bloqueB },
    { id: 'C',     label: 'Bloque C · Volumen suficiente', description: 'Compras ≥ 4 y carritos ≥ 30 (muestra meaningful)', passed: bloqueC },
    { id: 'Cplus', label: 'Bloque C+ · Embudo sano',       description: 'Ratios pago/compra ≥ 30% cada uno', passed: bloqueCplus },
  ]

  const risk = RISK_BADGE[riskLevel] || RISK_BADGE['SIN_VOLUMEN']

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
        }}>
          Evaluación de escalado
        </p>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '3px 10px', borderRadius: 99,
          background: risk.bg,
          color: risk.color,
          border: `1px solid ${risk.border}`,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {risk.label}
        </span>
      </div>

      {/* 4 block rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {rows.map(row => (
          <div key={row.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--ds-card-radius-sm)',
            background: row.passed ? 'var(--ds-color-success-soft)' : 'var(--ds-bg-elevated)',
            border: `1px solid ${row.passed ? 'var(--ds-color-success-border)' : 'var(--ds-card-border)'}`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: row.passed ? 'var(--ds-color-success)' : 'var(--ds-color-danger-soft)',
              border: row.passed ? 'none' : '1px solid var(--ds-color-danger-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>
              {row.passed
                ? <Check size={13} color="#06241a" strokeWidth={3} />
                : <X size={12} color="var(--ds-color-danger)" strokeWidth={3} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 600,
                color: row.passed ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)',
                lineHeight: 1.3,
              }}>
                {row.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ds-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                {row.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Final decision */}
      <div style={{
        padding: '12px 14px',
        borderRadius: 'var(--ds-card-radius-sm)',
        background: canScale ? 'var(--ds-color-success-soft)' : 'var(--ds-color-danger-soft)',
        border: `1px solid ${canScale ? 'var(--ds-color-success-border)' : 'var(--ds-color-danger-border)'}`,
      }}>
        {canScale ? (
          <>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ds-color-success)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✅ Escalado permitido {scalePctSuggested > 0 && `(+${scalePctSuggested}%)`}
            </p>
            {motivo && (
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                {motivo}
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ds-color-danger)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              🚫 Escalado no recomendado
            </p>
            {motivo && (
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                {motivo}
              </p>
            )}
          </>
        )}
      </div>

      {/* Bloque C final indicator (meta-block derived) */}
      <div style={{
        marginTop: 8, fontSize: 10, color: 'var(--ds-text-muted)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span>Bloque C final (C ∧ C+): </span>
        <strong style={{ color: bloqueCfinal ? 'var(--ds-color-success)' : 'var(--ds-color-danger)' }}>
          {bloqueCfinal ? 'OK' : 'NO'}
        </strong>
      </div>
    </div>
  )
}
