// src/components/intelligence/ForecastWidget.tsx
// 3-scenario forecast widget powered by the intelligence engine.
import SectionHeader from '@/components/ui/SectionHeader'

export interface ForecastScenarioProps {
  name: string
  description: string
  projectedSpend: number
  projectedRevenue: number
  projectedRoas: number
  projectedPurchases: number
  projectedCpa?: number
  scalePct: number
  confidence: number
  risks: string[]
  conditions: string[]
}

interface Props {
  scenarios: ForecastScenarioProps[]
  recommendation: string
  currentMetrics: { spend: number; revenue: number; roas: number; purchases: number }
  currencySymbol?: string
}

function formatNumber(n: number, opts?: { currency?: boolean; symbol?: string }): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  const symbol = opts?.symbol || '$'
  if (opts?.currency) {
    return `${symbol}${Math.round(n).toLocaleString('es')}`
  }
  return Math.round(n).toLocaleString('es')
}

function getRecommendedScenarioName(scenarios: ForecastScenarioProps[], recommendation: string): string {
  // Parse hints from the recommendation string
  const lower = recommendation.toLowerCase()
  if (lower.includes('crecimiento')) return 'Crecimiento'
  if (lower.includes('optimista'))   return 'Optimista'
  if (lower.includes('conservador')) return 'Conservador'
  // Fallback — highest confidence with some scale
  const withScale = scenarios.filter(s => s.confidence > 0)
  return withScale.reduce((best, s) => s.confidence > best.confidence ? s : best, withScale[0] || scenarios[0])?.name || ''
}

export default function ForecastWidget({ scenarios, recommendation, currentMetrics, currencySymbol }: Props) {
  const recommendedName = getRecommendedScenarioName(scenarios, recommendation)

  return (
    <div className="dash-anim-4">
      <SectionHeader
        title="Proyección del próximo mes"
        subtitle="Basada en tu rendimiento actual y la inteligencia del sistema"
      />

      <div className="ds-grid-3" style={{ marginBottom: 'var(--ds-space-md)' }}>
        {scenarios.map(scenario => {
          const isRecommended = scenario.name === recommendedName
          const isUnavailable = scenario.confidence === 0

          return (
            <div
              key={scenario.name}
              style={{
                position: 'relative',
                padding: 'var(--ds-space-lg)',
                borderRadius: 'var(--ds-card-radius)',
                border: isRecommended
                  ? '1px solid var(--ds-color-primary-border)'
                  : '1px solid var(--ds-card-border)',
                boxShadow: isRecommended ? 'var(--ds-glow-primary)' : 'var(--ds-shadow-sm)',
                opacity: isUnavailable ? 0.55 : 1,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
              {isRecommended && (
                <div style={{
                  position: 'absolute', top: -10, left: 16,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99,
                  background: 'var(--ds-color-primary)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  boxShadow: '0 6px 14px rgba(96, 165, 250, 0.35)',
                }}>
                  ⭐ Recomendado
                </div>
              )}

              {/* Header */}
              <div>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 16, fontWeight: 700,
                  color: 'var(--ds-text-primary)',
                  marginBottom: 4,
                }}>
                  {scenario.name === 'Conservador' && '📊 '}
                  {scenario.name === 'Crecimiento' && '📈 '}
                  {scenario.name === 'Optimista' && '🚀 '}
                  {scenario.name === 'Sin datos' && '⏳ '}
                  {scenario.name}
                </h3>
                <p style={{
                  fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.45,
                }}>
                  {scenario.description}
                </p>
              </div>

              {/* Metrics */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: 12,
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-card-border)',
                borderRadius: 'var(--ds-card-radius-sm)',
              }}>
                {[
                  { label: 'Inversión', value: formatNumber(scenario.projectedSpend, { currency: true, symbol: currencySymbol }) },
                  { label: 'Revenue',   value: formatNumber(scenario.projectedRevenue, { currency: true, symbol: currencySymbol }) },
                  { label: 'ROAS',      value: scenario.projectedRoas > 0 ? `${scenario.projectedRoas.toFixed(1)}x` : '—' },
                  { label: 'Compras',   value: formatNumber(scenario.projectedPurchases) },
                ].map(m => (
                  <div key={m.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 11,
                  }}>
                    <span style={{ color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      {m.label}
                    </span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--ds-text-primary)' }}>
                      {m.value}
                    </span>
                  </div>
                ))}
                {scenario.scalePct > 0 && (
                  <div style={{
                    marginTop: 4, paddingTop: 8,
                    borderTop: '1px solid var(--ds-card-border)',
                    fontSize: 10, color: 'var(--ds-color-primary)', fontWeight: 700,
                  }}>
                    Escalado: +{scenario.scalePct}%
                  </div>
                )}
              </div>

              {/* Confidence bar */}
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 10, marginBottom: 4,
                }}>
                  <span style={{ color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    Confianza
                  </span>
                  <span style={{ color: 'var(--ds-text-primary)', fontWeight: 700 }}>
                    {Math.round(scenario.confidence * 100)}%
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 99,
                  background: 'rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      height: '100%',
                      width: `${scenario.confidence * 100}%`,
                      background: scenario.confidence >= 0.7
                        ? 'var(--ds-color-success)'
                        : scenario.confidence >= 0.4
                          ? 'var(--ds-color-warning)'
                          : 'var(--ds-color-danger)',
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>

              {/* Risks */}
              {scenario.risks.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--ds-text-label)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    Riesgos
                  </p>
                  <ul style={{
                    listStyle: 'none', padding: 0, margin: 0,
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    {scenario.risks.slice(0, 2).map((risk, i) => (
                      <li key={i} style={{
                        fontSize: 11, color: 'var(--ds-text-secondary)',
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        lineHeight: 1.4,
                      }}>
                        <span style={{ color: 'var(--ds-color-warning)', flexShrink: 0 }}>•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recommendation card */}
      {recommendation && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--ds-card-radius-sm)',
          background: 'var(--ds-color-primary-soft)',
          border: '1px solid var(--ds-color-primary-border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>💡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'var(--ds-color-primary)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
            }}>
              Recomendación del sistema
            </p>
            <p style={{ fontSize: 13, color: 'var(--ds-text-primary)', lineHeight: 1.5 }}>
              {recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
