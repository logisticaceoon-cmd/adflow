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
  onBack: () => void
  onNext: () => void
}

export default function StepStrategy({ form, setField, recommended, diagnosis, error, onBack, onNext }: Props) {
  return (
    <div className="space-y-5">
      <style>{`
        @keyframes stratCardIn { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .strat-card { animation: stratCardIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .strat-card:hover { transform: translateY(-4px); transition: transform 0.2s ease; }
      `}</style>

      {/* Diagnosis result banner */}
      <div style={{ borderRadius: 16, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(233,30,140,0.10), rgba(98,196,176,0.07))', border: '1px solid rgba(233,30,140,0.25)' }}>
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
            <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Esta estrategia requiere Pixel de Meta instalado</p>
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
          return (
            <button key={type}
              onClick={() => setField('strategy_type', type)}
              className="strat-card w-full text-left"
              style={{
                animationDelay: `${idx * 60}ms`,
                borderRadius: 18, padding: '20px 22px',
                background: selected ? cfg.bg : 'linear-gradient(160deg, rgba(18,4,10,0.90), rgba(12,3,7,0.94))',
                border: `${selected ? '1.5px' : '1px'} solid ${selected ? cfg.borderColor : 'rgba(255,255,255,0.10)'}`,
                boxShadow: selected ? `0 0 28px ${cfg.color}25, 0 8px 32px rgba(0,0,0,0.50)` : '0 4px 20px rgba(0,0,0,0.40)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.22s ease',
              }}>
              {isRecommended && (
                <div style={{ position: 'absolute', top: 14, right: 14, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${cfg.color}25`, border: `1px solid ${cfg.color}50`, color: cfg.color }}>
                  ★ Recomendado
                </div>
              )}
              {selected && !isRecommended && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900 }}>✓</div>
              )}
              <div className="flex items-start gap-4">
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `radial-gradient(circle at 38% 38%, ${cfg.color}30, ${cfg.color}10)`,
                  border: `1.5px solid ${selected ? cfg.color + '60' : cfg.color + '25'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  boxShadow: selected ? `0 0 20px ${cfg.color}40` : 'none',
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
                  {selected && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {cfg.results.map((r, ri) => (
                        <span key={ri} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
                          {r}
                        </span>
                      ))}
                    </div>
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
