'use client'
// Step 4: "Revisá y publicá" — Meta Ad preview cards with copy variant selection
import { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import type { AIStrategy, AdCopyItem, CopyVariant } from '@/types'

interface Props {
  aiStrategy: AIStrategy | null
  currSymbol: string
  dailyBudget: number
  mediaPreviews: Array<string | null>
  editedCopies: Record<string, Partial<AdCopyItem>>
  onPatchAd: (setIdx: number, adIdx: number, field: keyof AdCopyItem, value: string) => void
  isPublishing: boolean
  publishError: string
  savingDraft: boolean
  onAdjust: () => void
  onSaveDraft: () => void
  onPublish: () => void
}

function AdPreviewCard({
  ad, imageUrl, pageName, selected, onSelect, variant,
}: {
  ad: AdCopyItem
  imageUrl: string | null
  pageName: string
  selected: boolean
  onSelect: () => void
  variant: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left w-full transition-all"
      style={{
        borderRadius: 10,
        border: selected ? '2px solid var(--ds-color-primary)' : '2px solid var(--ds-card-border)',
        background: selected ? 'rgba(79,110,247,0.04)' : 'var(--ds-bg-elevated)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Selection badge */}
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 2,
        width: 24, height: 24, borderRadius: 99,
        background: selected ? 'var(--ds-color-primary)' : 'rgba(255,255,255,0.1)',
        border: selected ? 'none' : '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Check size={14} style={{ color: '#fff' }} strokeWidth={3} />}
      </div>

      {/* Page name + "Sponsored" */}
      <div style={{ padding: '10px 12px 0' }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid rgba(79,110,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)',
          }}>
            {pageName.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{pageName}</p>
            <p style={{ fontSize: 9, color: 'var(--ds-text-muted)' }}>Publicidad</p>
          </div>
        </div>
      </div>

      {/* Primary text */}
      <div style={{ padding: '8px 12px' }}>
        <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
          {ad.primary_text || '—'}
        </p>
      </div>

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1.2',
        background: '#0a0f1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', padding: 16, textAlign: 'center' }}>
            {ad.creative_suggestion || 'Sin imagen'}
          </p>
        )}
      </div>

      {/* Headline + CTA bar */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {ad.headline || '—'}
          </p>
          {ad.description && (
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>
              {ad.description}
            </p>
          )}
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: 'rgba(255,255,255,0.1)', color: '#fff', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {ad.call_to_action || 'Ver más'}
        </div>
      </div>

      {/* Variant label */}
      <div style={{
        padding: '4px 12px 6px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: selected ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)', textTransform: 'uppercase' }}>
          {variant}
        </span>
      </div>
    </button>
  )
}

export default function StepPublish({
  aiStrategy, currSymbol, dailyBudget,
  mediaPreviews, editedCopies, onPatchAd,
  isPublishing, publishError, savingDraft,
  onAdjust, onSaveDraft, onPublish,
}: Props) {
  const [expandedSet, setExpandedSet] = useState(0)
  // Track selected variant per ad: key = "setIdx-adIdx", value = 'short' | 'medium' | 'long'
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({})

  const campaign = aiStrategy?.campaign
  const adSets   = campaign?.ad_sets || []
  const results  = aiStrategy?.estimated_results
  const diagnosis = (aiStrategy as any)?.diagnosis
  const pageName = campaign?.name?.split('—')[0]?.trim() || 'Tu negocio'

  const validPreviews = mediaPreviews.filter(Boolean) as string[]

  function getAd(setIdx: number, adIdx: number): AdCopyItem {
    const base  = adSets[setIdx]?.ads?.[adIdx] || {} as AdCopyItem
    const edits = editedCopies[`${setIdx}-${adIdx}`] || {}
    return { ...base, ...edits }
  }

  function selectVariant(setIdx: number, adIdx: number, variant: string) {
    setSelectedVariant(prev => ({ ...prev, [`${setIdx}-${adIdx}`]: variant }))
    const ad = adSets[setIdx]?.ads?.[adIdx]
    if (!ad?.variants) return
    const v = (ad.variants as any)[variant] as CopyVariant | undefined
    if (v) {
      onPatchAd(setIdx, adIdx, 'headline', v.headline)
      onPatchAd(setIdx, adIdx, 'primary_text', v.primary_text)
    }
  }

  return (
    <div className="space-y-5">
      {/* Campaign header */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 4 }}>
              Tu campaña está lista
            </p>
            <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {campaign?.name || 'Campaña generada por IA'}
            </h2>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)',
            border: '1px solid rgba(79,110,247,0.3)',
          }}>
            {aiStrategy?.strategy_type || 'TOFU'}
          </div>
        </div>

        {diagnosis && (
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            {diagnosis.opportunity || diagnosis.main_challenge || ''}
          </p>
        )}

        {results && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Alcance',  value: results.daily_reach },
              { label: 'Clics',    value: results.daily_clicks },
              { label: 'CPM',      value: results.estimated_cpm },
            ].map((m, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-card-border)',
              }}>
                <p style={{ fontSize: 9, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ad Sets with preview cards */}
      {adSets.map((adSet: any, setIdx: number) => {
        const isOpen = expandedSet === setIdx
        return (
          <div key={setIdx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExpandedSet(isOpen ? -1 : setIdx)}
              className="w-full text-left flex items-center gap-3 transition-colors"
              style={{ padding: '14px 18px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff' }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--ds-color-primary-soft)',
                border: '1px solid rgba(79,110,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)',
              }}>
                {setIdx + 1}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 13, fontWeight: 700 }}>{adSet.name}</p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
                  {adSet.audience_type} · {adSet.ads?.length || 0} anuncios · {currSymbol}{Math.round((adSet.daily_budget || 0) / 100)}/día
                </p>
              </div>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
              <div style={{ padding: '0 18px 18px' }}>
                {adSet.ads?.map((ad: any, adIdx: number) => {
                  const editedAd = getAd(setIdx, adIdx)
                  const sel = selectedVariant[`${setIdx}-${adIdx}`] || 'medium'
                  const imageForAd = validPreviews[adIdx % validPreviews.length] || null
                  const hasVariants = !!ad.variants?.medium

                  const VARIANT_LABELS: Record<string, { label: string; tag: string }> = {
                    medium: { label: 'Mediana', tag: '~150 chars' },
                    long:   { label: 'Larga',   tag: '~300 chars' },
                  }

                  // Build ad object for each variant
                  function adForVariant(key: string): AdCopyItem {
                    if (key === sel) return editedAd
                    if (key === 'medium') return ad
                    const v = ad.variants?.[key]
                    if (!v) return ad
                    return { ...ad, headline: v.headline, primary_text: v.primary_text }
                  }

                  return (
                    <div key={adIdx} style={{
                      marginBottom: adIdx < (adSet.ads.length - 1) ? 16 : 0,
                      paddingTop: adIdx > 0 ? 16 : 0,
                      borderTop: adIdx > 0 ? '1px solid var(--ds-card-border)' : 'none',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ds-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {ad.copy_angle || `Anuncio ${adIdx + 1}`}
                      </p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: hasVariants ? '1fr 1fr' : '1fr',
                        gap: 12,
                        maxWidth: hasVariants ? 440 : 220,
                      }}>
                        {(hasVariants ? ['medium', 'long'] : ['medium']).map(vKey => (
                          <AdPreviewCard
                            key={vKey}
                            ad={adForVariant(vKey)}
                            imageUrl={imageForAd}
                            pageName={pageName}
                            selected={sel === vKey}
                            onSelect={() => selectVariant(setIdx, adIdx, vKey)}
                            variant={VARIANT_LABELS[vKey]?.label || vKey}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Budget tip */}
      {aiStrategy?.budget_tip && (
        <div className="p-3 rounded-xl" style={{
          background: 'rgba(79,110,247,0.06)',
          border: '1px solid rgba(79,110,247,0.15)',
        }}>
          <p style={{ fontSize: 11, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
            {aiStrategy.budget_tip}
          </p>
        </div>
      )}

      {publishError && (
        <div className="p-3 rounded-xl text-sm" style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171',
        }}>
          {publishError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #1877F2, #0d47a1)',
            color: '#fff', border: 'none', cursor: isPublishing ? 'not-allowed' : 'pointer',
            opacity: isPublishing ? 0.6 : 1,
          }}
        >
          {isPublishing ? 'Publicando en Meta...' : 'Publicar campaña en Meta'}
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
          >
            {savingDraft ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            onClick={onAdjust}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'transparent', border: '1px solid var(--ds-card-border)', color: 'var(--ds-text-secondary)', cursor: 'pointer' }}
          >
            Ajustar
          </button>
        </div>
      </div>
    </div>
  )
}
