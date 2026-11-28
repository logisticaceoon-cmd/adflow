'use client'
// Step 4: "Revisá y publicá" — Per-ad multi-select copy variants + Meta preview
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

/* ── Meta-valid CTA display labels ── */
const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Más información',
  SHOP_NOW: 'Comprar',
  SIGN_UP: 'Registrarse',
  CONTACT_US: 'Contactar',
  SUBSCRIBE: 'Suscribirse',
  GET_OFFER: 'Ver oferta',
  GET_QUOTE: 'Solicitar info',
  DOWNLOAD: 'Descargar',
  ORDER_NOW: 'Pedir ahora',
  BOOK_TRAVEL: 'Reservar',
  APPLY_NOW: 'Aplicar ahora',
  SEND_MESSAGE: 'Enviar mensaje',
  MESSAGE_PAGE: 'Enviar mensaje',
  WHATSAPP_MESSAGE: 'Enviar WhatsApp',
  WATCH_MORE: 'Ver más',
  BUY_TICKETS: 'Comprar entradas',
  CALL_NOW: 'Llamar',
  GET_DIRECTIONS: 'Cómo llegar',
}

function ctaDisplay(ad: AdCopyItem): string {
  // If cta_type exists, use the meta-valid label
  const ctaType = (ad as any).cta_type as string | undefined
  if (ctaType && CTA_LABELS[ctaType]) return CTA_LABELS[ctaType]
  // Fallback to call_to_action text or default
  return ad.call_to_action || 'Más información'
}

/* ── Meta Ad preview card (image + headline + CTA) ── */
function AdImageCard({
  ad, imageUrl, pageName,
}: {
  ad: AdCopyItem
  imageUrl: string | null
  pageName: string
}) {
  return (
    <div style={{
      borderRadius: 8,
      border: '1px solid var(--ds-card-border)',
      background: 'var(--ds-bg-elevated)',
      overflow: 'hidden',
    }}>
      {/* Page name + Sponsored */}
      <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--ds-color-primary-soft)',
          border: '1px solid rgba(79,110,247,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'var(--ds-color-primary)',
        }}>
          {pageName.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{pageName}</p>
          <p style={{ fontSize: 9, color: 'var(--ds-text-muted)' }}>Publicidad</p>
        </div>
      </div>

      {/* Image — 1080x1350 ratio (4:5 portrait, Instagram/Feed standard) */}
      <div style={{
        width: '100%', aspectRatio: '1080 / 1350',
        background: '#0a0f1e',
        overflow: 'hidden',
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', padding: 12, textAlign: 'center' }}>
              {ad.creative_suggestion || 'Sin imagen'}
            </p>
          </div>
        )}
      </div>

      {/* Headline + CTA */}
      <div style={{
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {ad.headline || '—'}
          </p>
          {ad.description && (
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 1 }}>{ad.description}</p>
          )}
        </div>
        <div style={{
          padding: '5px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: 'rgba(255,255,255,0.12)', color: '#fff', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {ctaDisplay(ad)}
        </div>
      </div>
    </div>
  )
}

/* ── Selectable copy variant (multi-select: can pick both) ── */
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
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        border: selected ? '2px solid var(--ds-color-primary)' : '1px solid var(--ds-card-border)',
        background: selected ? 'rgba(79,110,247,0.06)' : 'rgba(255,255,255,0.02)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: selected ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)',
        }}>
          {label}
        </span>
        <div style={{
          width: 16, height: 16, borderRadius: 4,
          background: selected ? 'var(--ds-color-primary)' : 'transparent',
          border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <Check size={10} style={{ color: '#fff' }} strokeWidth={3} />}
        </div>
      </div>
      <p style={{
        fontSize: 11, color: selected ? 'var(--ds-text-secondary)' : 'var(--ds-text-muted)',
        lineHeight: 1.5, margin: 0,
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

  // Pull from targeting object
  if (targeting.age_range) chips.push(targeting.age_range)
  if (targeting.age_min || targeting.age_max) {
    chips.push(`${targeting.age_min || 18}–${targeting.age_max || 65}+`)
  }
  if (targeting.gender && targeting.gender !== 'all') chips.push(targeting.gender)
  if (targeting.genders) chips.push(targeting.genders)
  if (targeting.locations) {
    const loc = Array.isArray(targeting.locations) ? targeting.locations.join(', ') : targeting.locations
    chips.push(loc)
  }
  if (targeting.geo_locations) {
    const geo = Array.isArray(targeting.geo_locations) ? targeting.geo_locations.join(', ') : typeof targeting.geo_locations === 'string' ? targeting.geo_locations : ''
    if (geo) chips.push(geo)
  }
  if (targeting.interests?.length) {
    const ints = targeting.interests.map((i: any) => typeof i === 'string' ? i : i.name || '').filter(Boolean)
    if (ints.length) chips.push(ints.slice(0, 5).join(', '))
  }
  if (targeting.behaviors?.length) {
    const beh = targeting.behaviors.map((b: any) => typeof b === 'string' ? b : b.name || '').filter(Boolean)
    if (beh.length) chips.push(beh.slice(0, 3).join(', '))
  }

  // Fallbacks from adSet itself
  if (adSet.audience_description) chips.push(adSet.audience_description)
  if (adSet.optimization_goal) chips.push(`Opt: ${adSet.optimization_goal}`)
  if (adSet.advantage_plus) chips.push('Advantage+')

  // Parse name for context if no other data
  if (chips.length === 0 && adSet.name) {
    // Extract parenthetical from name like "Intereses Específicos (Salud, Bienestar)"
    const match = adSet.name.match(/\(([^)]+)\)/)
    if (match) chips.push(match[1])
    if (adSet.audience_type) chips.push(adSet.audience_type)
  }

  if (chips.length === 0) return null

  return (
    <div style={{
      padding: '10px 12px', marginBottom: 12, borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Users size={13} style={{ color: 'var(--ds-text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ds-text-muted)' }}>
          Audiencia
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((chip, i) => (
          <span key={i} style={{
            fontSize: 10, color: 'var(--ds-text-secondary)',
            padding: '3px 10px', borderRadius: 99,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {chip}
          </span>
        ))}
      </div>
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
  // Multi-select: key = "setIdx-adIdx", value = Set of selected variants
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Set<string>>>({})

  const campaign = aiStrategy?.campaign
  const adSets   = campaign?.ad_sets || []
  const results  = aiStrategy?.estimated_results
  const diagnosis = (aiStrategy as any)?.diagnosis
  const pageName = campaign?.name?.split('—')[0]?.trim() || 'Tu negocio'

  const validPreviews = mediaPreviews.filter(Boolean) as string[]

  function getSelectedSet(setIdx: number, adIdx: number): Set<string> {
    return selectedVariants[`${setIdx}-${adIdx}`] || new Set(['medium'])
  }

  function toggleVariant(setIdx: number, adIdx: number, variant: string) {
    setSelectedVariants(prev => {
      const key = `${setIdx}-${adIdx}`
      const current = new Set(prev[key] || ['medium'])
      if (current.has(variant)) {
        // Don't allow deselecting if it's the only one
        if (current.size > 1) current.delete(variant)
      } else {
        current.add(variant)
      }
      // Apply the first selected variant to the editable copy
      const primary = current.has('medium') ? 'medium' : 'long'
      const ad = adSets[setIdx]?.ads?.[adIdx]
      if (ad?.variants) {
        const v = (ad.variants as any)[primary] as CopyVariant | undefined
        if (v) {
          onPatchAd(setIdx, adIdx, 'headline', v.headline)
          onPatchAd(setIdx, adIdx, 'primary_text', v.primary_text)
        }
      }
      return { ...prev, [key]: current }
    })
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

                {/* Ads grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fill, minmax(220px, 280px))`,
                  gap: 16,
                }}>
                  {adSet.ads?.map((ad: any, adIdx: number) => {
                    const selSet = getSelectedSet(setIdx, adIdx)
                    const imageForAd = validPreviews[adIdx % validPreviews.length] || null

                    // Get variant texts
                    const mediumVariant = ad.variants?.medium
                    const longVariant = ad.variants?.long
                    const mediumText = mediumVariant?.primary_text || ad.primary_text || ''
                    const longText = longVariant?.primary_text || ad.primary_text || ''

                    // Display uses the first selected variant
                    const primary = selSet.has('medium') ? 'medium' : 'long'
                    const pv = primary === 'medium' ? mediumVariant : longVariant
                    const displayAd: AdCopyItem = {
                      ...ad,
                      headline: pv?.headline || ad.headline,
                      primary_text: pv?.primary_text || ad.primary_text,
                    }

                    return (
                      <div key={adIdx}>
                        {/* Angle label */}
                        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {ad.copy_angle || `Anuncio ${adIdx + 1}`}
                        </p>

                        {/* Copy variant selectors — multi-select checkboxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                          <CopyVariantBlock
                            label="Mediana"
                            text={mediumText}
                            selected={selSet.has('medium')}
                            onClick={() => toggleVariant(setIdx, adIdx, 'medium')}
                          />
                          <CopyVariantBlock
                            label="Larga"
                            text={longText}
                            selected={selSet.has('long')}
                            onClick={() => toggleVariant(setIdx, adIdx, 'long')}
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
