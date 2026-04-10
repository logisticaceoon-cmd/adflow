'use client'
// src/components/campaign/StepReview.tsx — Step 4: Revisión IA
import { useState } from 'react'
import { ChevronDown, ChevronUp, Rocket, Check } from 'lucide-react'
import type { AIStrategy, AdCopyItem, CreateCampaignForm } from '@/types'
import { STRATEGY_CONFIG, GEN_STEPS, ANGLE_LABELS, ANGLE_ICONS } from './shared'
import { FacebookAdPreview, InstagramAdPreview } from './AdPreviewCard'
import { getCTAOptionsForObjective, CTA_OPTIONS } from '@/lib/strategy-engine'

interface Props {
  loading: boolean
  genStep: number
  aiStrategy: AIStrategy | null
  form: Pick<CreateCampaignForm, 'strategy_type' | 'daily_budget' | 'destination_url'>
  currency: string
  currSymbol: string
  budgetUSD: string | null
  pageName: string
  mediaPreviews: Array<string | null>
  editedCopies: Record<string, Partial<AdCopyItem>>
  onPatchAd: (setIdx: number, adIdx: number, field: keyof AdCopyItem, value: string) => void
  isPublishing: boolean
  publishError: string
  onAdjust: () => void
  onSaveDraft: () => void
  onPublish: () => void
  savingDraft: boolean
  pixelId?: string | null
}

export default function StepReview({
  loading, genStep, aiStrategy, form,
  currency, currSymbol, budgetUSD, pageName, mediaPreviews,
  editedCopies, onPatchAd,
  isPublishing, publishError,
  onAdjust, onSaveDraft, onPublish, savingDraft,
  pixelId,
}: Props) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [activeImageIdx,         setActiveImageIdx]         = useState(0)
  const [activeVariant,          setActiveVariant]          = useState(0)
  // Persists the chosen variant per image index
  const [selectedVariantByImage, setSelectedVariantByImage] = useState<Record<number, number>>({})
  const [previewMode,            setPreviewMode]            = useState<'facebook' | 'instagram'>('facebook')
  const [editingField,           setEditingField]           = useState<string | null>(null)
  const [strategyExpanded,       setStrategyExpanded]       = useState(false)

  // ── Derived data ──────────────────────────────────────────────────────────
  const adSets      = aiStrategy?.campaign?.ad_sets || []
  const numVariants = adSets[0]?.ads?.length || 3

  function getAd(setIdx: number, adIdx: number): AdCopyItem {
    const base  = adSets[setIdx]?.ads?.[adIdx] || {} as AdCopyItem
    const edits = editedCopies[`${setIdx}-${adIdx}`] || {}
    return { ...base, ...edits }
  }

  const validPreviews = mediaPreviews.filter(Boolean) as string[]
  const numImages     = validPreviews.length
  // Image shown in mockup = the one selected by activeImageIdx, not tied to variant
  const currentImage  = numImages > 0 ? (validPreviews[activeImageIdx] ?? validPreviews[0]) : null
  const activeAd      = getAd(0, activeVariant)
  const stratCfg      = STRATEGY_CONFIG[form.strategy_type]

  // ── CTA selector ──────────────────────────────────────────────────────────
  // Filter available CTAs based on the AI-generated campaign objective
  const campaignObjective = aiStrategy?.campaign?.objective
  const ctaOptions        = getCTAOptionsForObjective(campaignObjective)
  // Resolve current CTA type: prefer explicit cta_type field, else infer from label
  const currentCTAType = activeAd.cta_type ||
    CTA_OPTIONS.find(o => o.label.toLowerCase() === (activeAd.call_to_action || '').toLowerCase())?.type ||
    'LEARN_MORE'

  // Pixel: only show warning if strategy requires it AND user has no pixel configured
  const strategyRequiresPixel = !!(aiStrategy as any)?.pixel_warning
  const showPixelWarning      = strategyRequiresPixel && !pixelId

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSwitchImage(idx: number) {
    setActiveImageIdx(idx)
    // Restore previously selected variant for this image
    setActiveVariant(selectedVariantByImage[idx] ?? 0)
  }

  function handleSelectVariant(varIdx: number) {
    setActiveVariant(varIdx)
    // Persist selection for current image (or image 0 if no images uploaded)
    const imgKey = numImages > 0 ? activeImageIdx : 0
    setSelectedVariantByImage(prev => ({ ...prev, [imgKey]: varIdx }))
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card" style={{
        padding: 40, textAlign: 'center',
      }}>
        <div className="space-y-6">
          <div style={{
            width: 64, height: 64, margin: '0 auto', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--ds-color-primary-soft), var(--ds-card-border))',
            border: '1px solid var(--ds-color-primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            🤖
          </div>
          <div className="space-y-3">
            {GEN_STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: i < genStep ? 'linear-gradient(135deg, var(--ds-color-primary), #3a9a8a)'
                    : i === genStep ? 'linear-gradient(135deg, var(--ds-color-success), var(--ds-color-primary))'
                      : 'var(--ds-card-border)',
                  border: i > genStep ? '1px solid var(--ds-card-border)' : 'none',
                  boxShadow: i === genStep ? '0 0 12px transparent' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff', fontWeight: 900,
                }}>
                  {i < genStep ? '✓' : i === genStep ? '●' : ''}
                </div>
                <span style={{
                  fontSize: 13,
                  color: i === genStep ? '#fff' : i < genStep ? '#8892b0' : 'rgba(255,255,255,0.60)',
                  fontWeight: i === genStep ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!aiStrategy) return null

  // ── Review state ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Pixel info banner — only when pixel is NOT configured ────────── */}
      {showPixelWarning && (
        <div style={{
          borderRadius: 14, padding: '12px 16px',
          background: 'rgba(45, 212, 191,0.08)', border: '1px solid rgba(45, 212, 191,0.25)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
          <p className="text-xs" style={{ color: '#93c5fd', lineHeight: 1.6 }}>
            {(aiStrategy as any).pixel_warning}
          </p>
        </div>
      )}

      {/* ── Ad Preview Card ────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(18,4,10,0.92), rgba(12,3,7,0.96))',
        border: '1px solid var(--ds-card-border)',
      }}>

        {/* Header row */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="section-title" style={{ marginBottom: 3 }}>✨ Vista previa de anuncios</h2>
              <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                Revisá cada imagen con sus 3 variantes · click en el mockup para editar texto
              </p>
            </div>
            {/* FB / IG toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              {(['facebook', 'instagram'] as const).map(mode => (
                <button key={mode} onClick={() => setPreviewMode(mode)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: previewMode === mode ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: previewMode === mode ? '#fff' : '#8892b0',
                  }}>
                  {mode === 'facebook' ? '📘 Facebook' : '📸 Instagram'}
                </button>
              ))}
            </div>
          </div>

          {/* Image navigation tabs — only when there are multiple images */}
          {numImages > 1 && (
            <div style={{ marginTop: 14 }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
                Imagen seleccionada para previsualizar
              </p>
              <div className="flex gap-2 flex-wrap">
                {validPreviews.map((previewUrl, idx) => {
                  const isActive   = idx === activeImageIdx
                  const isChosen   = selectedVariantByImage[idx] !== undefined
                  return (
                    <button key={idx} onClick={() => handleSwitchImage(idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.14)' : 'var(--ds-bg-elevated)',
                        border: `1px solid ${isActive ? 'rgba(255,255,255,0.30)' : 'var(--ds-card-border)'}`,
                        color: isActive ? '#fff' : '#8892b0',
                      }}>
                      {/* Mini thumbnail */}
                      <span style={{
                        width: 18, height: 18, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                        background: '#222', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </span>
                      Imagen {idx + 1}
                      {isChosen && (
                        <Check size={10} style={{ color: 'var(--ds-color-primary)', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Variant tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {Array.from({ length: numVariants }, (_, i) => {
              const varAd     = getAd(0, i)
              const angle     = varAd.copy_angle || ''
              const hasEdits  = !!editedCopies[`0-${i}`]
              const imgKey    = numImages > 0 ? activeImageIdx : 0
              const isChosen  = selectedVariantByImage[imgKey] === i
              return (
                <button key={i} onClick={() => handleSelectVariant(i)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: activeVariant === i
                      ? 'linear-gradient(135deg, var(--ds-color-success-soft), var(--ds-color-primary-soft))'
                      : 'var(--ds-bg-elevated)',
                    border: `1px solid ${activeVariant === i ? 'transparent' : 'var(--ds-card-border)'}`,
                    color: activeVariant === i ? '#fff' : '#8892b0',
                    boxShadow: activeVariant === i ? '0 0 14px var(--ds-color-primary-soft)' : 'none',
                  }}>
                  <span>{ANGLE_ICONS[angle] || '📝'}</span>
                  <span>Variante {i + 1}</span>
                  {hasEdits && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ds-color-primary)', flexShrink: 0 }} title="Editada" />
                  )}
                  {isChosen && (
                    <Check size={9} style={{ color: 'var(--ds-color-primary)', flexShrink: 0 }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mockup preview */}
        <div style={{ padding: '20px 20px 0' }}>
          {previewMode === 'facebook'
            ? <FacebookAdPreview
                ad={activeAd} setIdx={0} adIdx={activeVariant}
                imageUrl={currentImage} pageName={pageName}
                destinationUrl={form.destination_url}
                editingField={editingField} setEditingField={setEditingField}
                onPatchAd={onPatchAd}
              />
            : <InstagramAdPreview
                ad={activeAd} setIdx={0} adIdx={activeVariant}
                imageUrl={currentImage} pageName={pageName}
                destinationUrl={form.destination_url}
                editingField={editingField} setEditingField={setEditingField}
                onPatchAd={onPatchAd}
              />
          }
        </div>

        {/* ── Copy detail panel — full readable text outside the mockup ────── */}
        <div style={{ margin: '16px 20px 20px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--ds-card-border)' }}>
          {/* Panel header */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
          }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Copy completo — Variante {activeVariant + 1}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                background: 'var(--ds-color-primary-soft)', border: '1px solid var(--ds-color-primary-border)', color: 'var(--ds-color-primary)',
              }}>
                {ANGLE_LABELS[activeAd.copy_angle] || activeAd.copy_angle || 'Sin ángulo'}
              </span>
            </div>
            {/* "Elegir esta variante" button */}
            {(() => {
              const imgKey  = numImages > 0 ? activeImageIdx : 0
              const chosen  = selectedVariantByImage[imgKey] === activeVariant
              return (
                <button onClick={() => handleSelectVariant(activeVariant)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: chosen ? 'var(--ds-card-border)' : 'var(--ds-card-border)',
                    border: `1px solid ${chosen ? 'var(--ds-card-border)' : 'rgba(255,255,255,0.14)'}`,
                    color: chosen ? 'var(--ds-color-primary)' : '#8892b0',
                  }}>
                  <Check size={10} />
                  {chosen ? 'Variante elegida ✓' : 'Elegir esta variante'}
                </button>
              )
            })()}
          </div>

          {/* Headline */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ds-card-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
              Headline
            </p>
            <p className="text-sm font-semibold leading-snug" style={{ color: '#fff' }}>
              {activeAd.headline || <em style={{ opacity: 0.35 }}>Sin headline</em>}
            </p>
          </div>

          {/* Primary text */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ds-card-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
              Texto principal
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activeAd.primary_text || <em style={{ opacity: 0.35 }}>Sin texto</em>}
            </p>
          </div>

          {/* Description + CTA row */}
          <div style={{ padding: '12px 14px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {activeAd.description && (
              <div style={{ flex: 1, minWidth: 120 }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
                  Descripción
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>{activeAd.description}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Botón CTA
              </p>
              {/* CTA selector — filtered by campaign objective, applied to all ad sets */}
              <select
                value={currentCTAType}
                onChange={e => {
                  const opt = ctaOptions.find(o => o.type === e.target.value)
                  if (!opt) return
                  // Apply CTA change to the active variant across ALL ad sets for consistency
                  adSets.forEach((_, si) => {
                    onPatchAd(si, activeVariant, 'call_to_action', opt.label)
                    onPatchAd(si, activeVariant, 'cta_type', opt.type)
                  })
                }}
                style={{
                  background: 'var(--ds-card-border)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'auto',
                }}
              >
                {ctaOptions.map(opt => (
                  <option key={opt.type} value={opt.type} style={{ background: '#1a0a14', color: '#fff' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* All-variants summary strip */}
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--ds-card-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
              Las {numVariants} variantes en resumen
            </p>
            <div className="space-y-1.5">
              {Array.from({ length: numVariants }, (_, i) => {
                const vAd      = getAd(0, i)
                const imgKey   = numImages > 0 ? activeImageIdx : 0
                const isActive = i === activeVariant
                const isChosen = selectedVariantByImage[imgKey] === i
                return (
                  <button key={i} onClick={() => handleSelectVariant(i)}
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: isActive ? 'var(--ds-color-primary-soft)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--ds-color-primary-border)' : 'transparent'}`,
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      background: isChosen ? 'var(--ds-card-border)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${isChosen ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: isChosen ? 'var(--ds-color-primary)' : 'transparent',
                    }}>
                      {isChosen ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="text-[10px] font-semibold" style={{ color: isActive ? 'var(--ds-color-primary)' : '#8892b0' }}>
                        {ANGLE_ICONS[vAd.copy_angle] || '📝'} V{i + 1} · {ANGLE_LABELS[vAd.copy_angle] || vAd.copy_angle}
                      </span>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8892b0' }}>
                        {vAd.headline}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Ad set info footer */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {adSets.length > 0 && (
            <span className="text-xs" style={{ color: '#8892b0' }}>{adSets[0]?.name}</span>
          )}
          {adSets.length > 1 && (
            <span className="text-xs" style={{ color: '#8892b0' }}>
              + {adSets.length - 1} conjunto{adSets.length > 2 ? 's' : ''} más
            </span>
          )}
        </div>
      </div>

      {/* ── Collapsible strategy summary ─────────────────────────────────────── */}
      <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--ds-card-border)' }}>
        <button
          onClick={() => setStrategyExpanded(s => !s)}
          className="w-full flex items-center justify-between px-5 py-4 transition-all"
          style={{ background: 'linear-gradient(160deg, rgba(18,4,10,0.92), rgba(12,3,7,0.96))' }}
        >
          <div className="flex items-center gap-3">
            <span style={{
              width: 26, height: 26, borderRadius: 8,
              background: `${stratCfg.color}20`, border: `1px solid ${stratCfg.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>
              {stratCfg.icon}
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold">Resumen de estrategia — {form.strategy_type}</p>
              <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                {adSets.length} conjuntos · {adSets.reduce((a, s) => a + (s.ads?.length || 0), 0)} anuncios
              </p>
            </div>
          </div>
          {strategyExpanded
            ? <ChevronUp size={16} style={{ color: 'var(--ds-text-secondary)', flexShrink: 0 }} />
            : <ChevronDown size={16} style={{ color: 'var(--ds-text-secondary)', flexShrink: 0 }} />
          }
        </button>

        {strategyExpanded && (
          <div style={{ background: 'linear-gradient(160deg, rgba(14,3,8,0.95), rgba(10,2,6,0.97))', padding: '0 20px 20px', borderTop: '1px solid var(--ds-card-border)' }}>
            <div className="mt-4 space-y-3">
              {adSets.map((s, si) => (
                <div key={si} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <p className="text-xs font-semibold">{s.name}</p>
                    <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                      {currSymbol}{(s.daily_budget / 100).toFixed(0)}/{currency}/día
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.targeting?.advantage_plus && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ds-card-border)', color: 'var(--ds-color-primary)' }}>⚡ Advantage+</span>
                    )}
                    {(s.targeting?.interests || []).slice(0, 3).map((interest: any, ii: number) => (
                      <span key={ii} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ds-card-border)', color: 'var(--ds-text-secondary)' }}>
                        🎯 {interest.name}
                      </span>
                    ))}
                    {/* Pixel badge: blue check if configured, blue info if needed but missing */}
                    {(s as any).requires_pixel && pixelId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(45, 212, 191,0.14)', color: '#93c5fd' }}>
                        ✓ Pixel configurado
                      </span>
                    )}
                    {(s as any).requires_pixel && !pixelId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(45, 212, 191,0.10)', color: '#7dd3fc' }}>
                        ℹ Requiere Pixel
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {aiStrategy.estimated_results && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'transparent', border: '1px solid transparent' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ds-color-primary)' }}>📊 Resultados estimados</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(aiStrategy.estimated_results)
                    .filter(([, v]) => v && v !== 'N/A')
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>{k.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-semibold">{String(v)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {aiStrategy.budget_tip && (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: '#8892b0' }}>
                💡 {aiStrategy.budget_tip}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Budget display */}
      <div className="px-1 text-sm flex items-center gap-2" style={{ color: 'var(--ds-text-secondary)' }}>
        <span>💰</span>
        <span>
          Presupuesto: <strong style={{ color: '#fff' }}>{currSymbol}{form.daily_budget} {currency}/día</strong>
          {budgetUSD && <span className="ml-2 text-xs" style={{ color: '#8892b0' }}>({budgetUSD})</span>}
        </span>
      </div>

      {/* Publish error */}
      {publishError && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid var(--ds-color-danger-border)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Error al publicar en Meta</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.80)' }}>{publishError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-1">
        <button onClick={onAdjust} className="btn-ghost" style={{ flex: '0 0 auto' }}>
          ← Ajustar
        </button>
        <button
          onClick={onSaveDraft}
          disabled={savingDraft || isPublishing}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }}
        >
          {savingDraft ? '...' : '💾 Guardar borrador'}
        </button>
        <button
          onClick={onPublish}
          disabled={savingDraft || isPublishing}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
          style={{
            background: isPublishing ? 'transparent' : 'linear-gradient(135deg, var(--ds-color-success), var(--ds-color-primary))',
            color: '#fff',
            boxShadow: isPublishing ? 'none' : '0 4px 20px var(--ds-color-success-border)',
          }}
        >
          {isPublishing
            ? <><span className="animate-spin inline-block">⏳</span> Publicando...</>
            : <><Rocket size={14} /> Publicar en Meta</>
          }
        </button>
      </div>
    </div>
  )
}
