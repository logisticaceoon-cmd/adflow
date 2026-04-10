'use client'
// src/components/campaign/StepStrategy.tsx — Step 2: Estrategia TOFU/MOFU/BOFU
import type { CreateCampaignForm, StrategyType } from '@/types'
import type { DiagnosisData } from './shared'
import { STRATEGY_CONFIG, buildDiagnosisReason } from './shared'

interface Props {
  form: Pick<CreateCampaignForm, 'strategy_type'>
  setField: <K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) => void
  recommended: StrategyType
  diagnosis: DiagnosisData
  error: string
  availableStrategies?: string[]
  pixelLevelName?: string
  onBack: () => void
  onNext: () => void
}

// Minimum pixel level required to unlock each strategy
const STRATEGY_REQUIREMENT: Record<StrategyType, { level: number; need: string }> = {
  TOFU: { level: 0, need: 'sin requisitos' },
  MOFU: { level: 3, need: '1.000+ ViewContent en 30 días' },
  BOFU: { level: 5, need: '50+ Purchases en 30 días' },
}

export default function StepStrategy({
  form, setField, recommended, diagnosis, error,
  availableStrategies, pixelLevelName, onBack, onNext,
}: Props) {
  const allowed = new Set<string>(availableStrategies && availableStrategies.length ? availableStrategies : ['TOFU', 'MOFU', 'BOFU'])
  return (
    <div className="space-y-5">
      <style>{`
        @keyframes stratCardIn { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .strat-card { animation: stratCardIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .strat-card:hover:not(:disabled) { transform: translateY(-4px); transition: transform 0.2s ease; }
      `}</style>

      {/* Step header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Paso 3 de 5 · Estrategia
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Tu estrategia recomendada
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
          Basada en tu diagnóstico y el nivel actual de tu pixel
        </p>
      </div>

      {/* Diagnosis result banner */}
      <div style={{ borderRadius: 16, padding: '16px 20px', background: 'var(--ds-color-primary-soft)', border: '1px solid var(--ds-color-primary-border)' }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#ffffff' }}>
              La IA analizó tu diagnóstico y recomienda:
              <span style={{
                marginLeft: 8, padding: '2px 10px', borderRadius: 20, fontSize: 11,
                background: `${STRATEGY_CONFIG[recommended].color}30`,
                border: `1px solid ${STRATEGY_CONFIG[recommended].color}50`,
                color: STRATEGY_CONFIG[recommended].color, fontWeight: 700,
              }}>
                {STRATEGY_CONFIG[recommended].icon} {recommended}
              </span>
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {buildDiagnosisReason(diagnosis, recommended)}
            </p>
          </div>
        </div>
      </div>

      {/* Pixel warning for MOFU/BOFU */}
      {(recommended === 'MOFU' || recommended === 'BOFU') && (
        <div style={{ borderRadius: 14, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--ds-color-warning)' }}>Esta estrategia requiere Pixel de Meta instalado</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,158,11,0.75)' }}>
              {recommended} usa retargeting/lookalike que necesitan el Pixel en tu sitio web. Si no lo tenés, seleccioná TOFU con Advantage+ que funciona sin Pixel.
            </p>
          </div>
        </div>
      )}

      {/* Strategy cards */}
      <div className="space-y-4">
        {(Object.entries(STRATEGY_CONFIG) as [StrategyType, typeof STRATEGY_CONFIG[StrategyType]][]).map(([type, cfg], idx) => {
          const selected      = form.strategy_type === type
          const isRecommended = recommended === type
          const isLocked      = !allowed.has(type)
          const requirement   = STRATEGY_REQUIREMENT[type]
          return (
            <button key={type}
              onClick={() => {
                if (isLocked) return
                setField('strategy_type', type)
              }}
              disabled={isLocked}
              title={isLocked ? `🔒 Tu pixel necesita más datos. Nivel actual: ${pixelLevelName || 'Sin Data'}. Necesitás: ${requirement.need}` : undefined}
              className="strat-card w-full text-left"
              style={{
                animationDelay: `${idx * 60}ms`,
                borderRadius: 18, padding: '20px 22px',
                background: selected ? cfg.bg : 'var(--ds-card-bg)',
                border: `${selected ? '1.5px' : '1px'} solid ${selected ? cfg.borderColor : 'var(--ds-card-border)'}`,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.45 : 1,
                position: 'relative',
                transition: 'all 0.22s ease',
              }}>
              {isLocked && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.40)',
                  color: '#f87171',
                }}>
                  🔒 Necesitás Nivel {requirement.level}
                </div>
              )}
              {!isLocked && isRecommended && (
                <div style={{ position: 'absolute', top: 14, right: 14, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${cfg.color}25`, border: `1px solid ${cfg.color}50`, color: cfg.color }}>
                  ★ Recomendado
                </div>
              )}
              {!isLocked && selected && !isRecommended && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900 }}>✓</div>
              )}
              <div className="flex items-start gap-4">
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `${cfg.color}18`,
                  border: `1.5px solid ${selected ? cfg.color + '60' : cfg.color + '25'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span style={{ fontSize: 16, fontWeight: 700, color: selected ? cfg.color : '#fff' }}>{type}</span>
                    <span style={{ fontSize: 12, color: selected ? cfg.color : '#8892b0' }}>— {cfg.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#8892b0', margin: '0 0 10px' }}>{cfg.metaObjectives}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: '0 0 6px' }}>{cfg.message}</p>
                  <p style={{ fontSize: 11.5, color: '#8892b0', margin: 0 }}>{cfg.forWho}</p>
                  {selected && !isLocked && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {cfg.results.map((r, ri) => (
                        <span key={ri} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  {isLocked && (
                    <p style={{ fontSize: 11, marginTop: 10, color: '#f87171', lineHeight: 1.5 }}>
                      Para desbloquear: {requirement.need}. Tu pixel está en nivel {pixelLevelName || 'Sin Data'}.
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost">← Atrás</button>
        <button onClick={onNext} className="btn-primary px-8">Siguiente → Contenido</button>
      </div>
    </div>
  )
}
