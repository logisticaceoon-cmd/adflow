'use client'
// Step 4: "Revisá y publicá" — Per-ad copy variant selection + compact Meta preview
import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Users } from 'lucide-react'
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

/* ── Compact Meta Ad preview (image + headline + CTA only) ── */
function AdImageCard({
  ad, imageUrl, pageName,
}: {
  ad: AdCopyItem
  imageUrl: string | null
  pageName: string
}) {
  return (
    <div style={{
      borderRadius: 6,
      border: '1px solid var(--ds-card-border)',
      background: 'var(--ds-bg-elevated)',
      overflow: 'hidden',
    }}>
      {/* Page name + Sponsored */}
      <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--ds-color-primary-soft)',
          border: '1px solid rgba(79,110,247,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 7, fontWeight: 700, color: 'var(--ds-color-primary)',
        }}>
          {pageName.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{pageName}</p>
          <p style={{ fontSize: 7, color: 'var(--ds-text-muted)' }}>Publicidad</p>
        </div>
      </div>

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1.2',
        background: '#0a0f1e',
        overflow: 'hidden',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 8, color: 'var(--ds-text-muted)', padding: 8, textAlign: 'center' }}>
              {ad.creative_suggestion || 'Sin imagen'}
            </p>
          </div>
        )}
      </div>

      {/* Headline + CTA */}
      <div style={{
        padding: '5px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1.2,
          flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {ad.headline || '—'}
        </p>
        <div style={{
          padding: '2px 6px', borderRadius: 3, fontSize: 7, fontWeight: 700,
          background: 'rgba(255,255,255,0.1)', color: '#fff', flexShrink: 0,
        }}>
          {ad.call_to_action || 'Ver más'}
        </div>
      </div>
    </div>
  )
}

/* ── Selectable copy variant block ── */
function CopyVariantBlock({
  label, text, selected, onClick,
}: {
  label: string
  text: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        border: selected ? '2px solid var(--ds-color-primary)' : '1px solid var(--ds-card-border)',
        background: selected ? 'rgba(79,110,247,0.06)' : 'rgba(255,255,255,0.02)',
        position: 'relative',
      }}
    >
      {/* Label + check */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{
          fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: selected ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)',
        }}>
          {label}
        </span>
        {selected && (
          <div style={{
            width: 14, height: 14, borderRadius: 99,
            background: 'var(--ds-color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={8} style={{ color: '#fff' }} strokeWidth={3} />
          </div>
        )}
      </div>
      <p style={{
        fontSize: 9, color: selected ? 'var(--ds-text-secondary)' : 'var(--ds-text-muted)',
        lineHeight: 1.4, margin: 0,
      }}>
        {text || '—'}
      </p>
    </button>
  )
}

/* ── Audience targeting summary ── */
function AudienceInfo({ adSet }: { adSet: any }) {
  const targeting = adSet.targeting || {}
  const chips: string[] = []

  if (targeting.age_range) chips.push(targeting.age_range)
  if (targeting.gender && targeting.gender !== 'all') chips.push(targeting.gender)
  if (targeting.locations) {
    const loc = Array.isArray(targeting.locations) ? targeting.locations.join(', ') : targeting.locations
    chips.push(loc)
  }
  if (targeting.interests?.length) chips.push(targeting.interests.slice(0, 4).join(', '))
  if (targeting.behaviors?.length) chips.push(targeting.behaviors.slice(0, 2).join(', '))
  if (adSet.audience_description) chips.push(adSet.audience_description)

  if (chips.length === 0) return null

  return (
    <div style={{
      padding: '8px 10px', marginBottom: 10, borderRadius: 6,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
    }}>
      <Users size={12} style={{ color: 'var(--ds-text-muted)', flexShrink: 0 }} />
      {chips.map((chip, i) => (
        <span key={i} style={{
          fontSize: 9, color: 'var(--ds-text-secondary)',
          padding: '2px 8px', borderRadius: 99,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {chip}
        </span>
      ))}
    </div>
  )
}

export default function StepPublish({
  aiStrategy, currSymbol, dailyBudget,
  mediaPreviews, editedCopies, onPatchAd,
  isPublishing, publishError, savingDraft,
  onAdjust, onSaveDraft, onPublish,
}: Props) {
  const [expandedSet, setExpandedSet] = useState(0)
  // Track selected variant per ad: key = "setIdx-adIdx", value = 'medium' | 'long'
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
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 4 }}>
              Tu campaña está lista
            </p>
            <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {campaign?.name || 'Campaña generada por IA'}
            </h2>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
            background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)',
            border: '1px solid rgba(79,110,247,0.3)',
          }}>
            {aiStrategy?.strategy_type || 'TOFU'}
          </div>
        </div>

        {diagnosis && (
          <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
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
                padding: '6px 8px', borderRadius: 6,
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-card-border)',
              }}>
                <p style={{ fontSize: 8, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ad Sets */}
      {adSets.map((adSet: any, setIdx: number) => {
        const isOpen = expandedSet === setIdx
        return (
          <div key={setIdx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExpandedSet(isOpen ? -1 : setIdx)}
              className="w-full text-left flex items-center gap-3 transition-colors"
              style={{ padding: '12px 16px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff' }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'var(--ds-color-primary-soft)',
                border: '1px solid rgba(79,110,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'var(--ds-color-primary)',
              }}>
                {setIdx + 1}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 12, fontWeight: 700 }}>{adSet.name}</p>
                <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>
                  {adSet.audience_type} · {adSet.ads?.length || 0} anuncios · {currSymbol}{Math.round((adSet.daily_budget || 0) / 100)}/día
                </p>
              </div>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
              <div style={{ padding: '0 16px 16px' }}>
                {/* Audience targeting info */}
                <AudienceInfo adSet={adSet} />

                {/* Ads grid — each ad: copy variants on top, image card below */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
                  gap: 14,
                }}>
                  {adSet.ads?.map((ad: any, adIdx: number) => {
                    const editedAd = getAd(setIdx, adIdx)
                    const sel = selectedVariant[`${setIdx}-${adIdx}`] || 'medium'
                    const imageForAd = validPreviews[adIdx % validPreviews.length] || null

                    // Get variant texts
                    const mediumVariant = ad.variants?.medium
                    const longVariant = ad.variants?.long
                    const mediumText = mediumVariant?.primary_text || ad.primary_text || ''
                    const longText = longVariant?.primary_text || ad.primary_text || ''

                    // Build the ad object for the preview card (uses selected variant)
                    const displayAd: AdCopyItem = sel === 'medium'
                      ? { ...ad, ...editedCopies[`${setIdx}-${adIdx}`] }
                      : {
                          ...ad,
                          headline: longVariant?.headline || ad.headline,
                          primary_text: longVariant?.primary_text || ad.primary_text,
                          ...editedCopies[`${setIdx}-${adIdx}`],
                        }

                    return (
                      <div key={adIdx} style={{ maxWidth: 240 }}>
                        {/* Angle label */}
                        <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--ds-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {ad.copy_angle || `Anuncio ${adIdx + 1}`}
                        </p>

                        {/* Copy variant selectors — above the image, separated */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                          <CopyVariantBlock
                            label="Mediana"
                            text={mediumText}
                            selected={sel === 'medium'}
                            onClick={() => selectVariant(setIdx, adIdx, 'medium')}
                          />
                          <CopyVariantBlock
                            label="Larga"
                            text={longText}
                            selected={sel === 'long'}
                            onClick={() => selectVariant(setIdx, adIdx, 'long')}
                          />
                        </div>

                        {/* Image card — separate from copy */}
                        <AdImageCard
                          ad={displayAd}
                          imageUrl={imageForAd}
                          pageName={pageName}
                        />
                      </div>
                    )
                  })}
                </div>
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
          <p style={{ fontSize: 10, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
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
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
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
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
          >
            {savingDraft ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            onClick={onAdjust}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'transparent', border: '1px solid var(--ds-card-border)', color: 'var(--ds-text-secondary)', cursor: 'pointer' }}
          >
            Ajustar
          </button>
        </div>
      </div>
    </div>
  )
}
