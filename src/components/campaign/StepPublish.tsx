'use client'
// Step 4: "Revisá y publicá" — clean review of AI-generated campaign
import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { AIStrategy, AdCopyItem } from '@/types'
import { ANGLE_ICONS } from './shared'

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

export default function StepPublish({
  aiStrategy, currSymbol, dailyBudget,
  mediaPreviews, editedCopies, onPatchAd,
  isPublishing, publishError, savingDraft,
  onAdjust, onSaveDraft, onPublish,
}: Props) {
  const [expandedSet, setExpandedSet] = useState(0)
  const [editingField, setEditingField] = useState<string | null>(null)

  const campaign = aiStrategy?.campaign
  const adSets   = campaign?.ad_sets || []
  const results  = aiStrategy?.estimated_results
  const diagnosis = (aiStrategy as any)?.diagnosis

  function getAd(setIdx: number, adIdx: number): AdCopyItem {
    const base  = adSets[setIdx]?.ads?.[adIdx] || {} as AdCopyItem
    const edits = editedCopies[`${setIdx}-${adIdx}`] || {}
    return { ...base, ...edits }
  }

  const validPreviews = mediaPreviews.filter(Boolean) as string[]

  return (
    <div className="space-y-5">
      {/* Campaign header card */}
      <div className="card" style={{ padding: 28 }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 6 }}>
              Tu campaña está lista
            </p>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {campaign?.name || 'Campaña generada por IA'}
            </h2>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)',
            border: '1px solid rgba(79,110,247,0.3)',
          }}>
            {aiStrategy?.strategy_type || 'TOFU'}
          </div>
        </div>

        {/* AI diagnosis */}
        {diagnosis && (
          <div className="mb-4 p-3 rounded-lg" style={{
            background: 'rgba(79,110,247,0.04)',
            border: '1px solid rgba(79,110,247,0.12)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
              🧠 {diagnosis.opportunity || diagnosis.main_challenge || ''}
            </p>
          </div>
        )}

        {/* Key metrics */}
        {results && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Alcance diario',  value: results.daily_reach },
              { label: 'Clics estimados', value: results.daily_clicks },
              { label: 'CPM estimado',    value: results.estimated_cpm },
            ].map((m, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-card-border)',
              }}>
                <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.value || '—'}</p>
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
            {/* Ad set header */}
            <button
              type="button"
              onClick={() => setExpandedSet(isOpen ? -1 : setIdx)}
              className="w-full text-left flex items-center gap-3 transition-colors"
              style={{
                padding: '16px 20px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#fff',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--ds-color-primary-soft)',
                border: '1px solid rgba(79,110,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--ds-color-primary)',
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

            {/* Ads within set */}
            {isOpen && adSet.ads?.map((ad: any, adIdx: number) => {
              const editedAd = getAd(setIdx, adIdx)
              const fieldKey = `${setIdx}-${adIdx}`
              return (
                <div key={adIdx} style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--ds-card-border)',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 14 }}>{ANGLE_ICONS[ad.copy_angle] || '📝'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-secondary)' }}>
                      {ad.copy_angle || `Anuncio ${adIdx + 1}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: editable fields */}
                    <div className="space-y-3">
                      {/* Headline */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headline</label>
                        {editingField === `${fieldKey}-headline` ? (
                          <input
                            className="input-field mt-1"
                            value={editedAd.headline || ''}
                            onChange={e => onPatchAd(setIdx, adIdx, 'headline', e.target.value)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            style={{ fontSize: 13 }}
                          />
                        ) : (
                          <p onClick={() => setEditingField(`${fieldKey}-headline`)}
                            className="cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                            {editedAd.headline || '—'}
                          </p>
                        )}
                      </div>

                      {/* Primary text */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texto principal</label>
                        {editingField === `${fieldKey}-text` ? (
                          <textarea
                            className="input-field mt-1"
                            rows={2}
                            value={editedAd.primary_text || ''}
                            onChange={e => onPatchAd(setIdx, adIdx, 'primary_text', e.target.value)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            style={{ fontSize: 13, resize: 'none' }}
                          />
                        ) : (
                          <p onClick={() => setEditingField(`${fieldKey}-text`)}
                            className="cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                            {editedAd.primary_text || '—'}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTA</label>
                        <p style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600, marginTop: 4 }}>
                          {editedAd.call_to_action || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Right: image preview if available */}
                    <div style={{
                      borderRadius: 10, overflow: 'hidden', aspectRatio: '1',
                      background: 'var(--ds-bg-elevated)',
                      border: '1px solid var(--ds-card-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {validPreviews[0] ? (
                        <img src={validPreviews[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <p style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>
                            {ad.creative_suggestion || 'Anuncio de solo texto'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Budget tip */}
      {aiStrategy?.budget_tip && (
        <div className="p-4 rounded-xl" style={{
          background: 'rgba(79,110,247,0.06)',
          border: '1px solid rgba(79,110,247,0.15)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
            💡 {aiStrategy.budget_tip}
          </p>
        </div>
      )}

      {/* Publish error */}
      {publishError && (
        <div className="p-3.5 rounded-xl text-sm" style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.28)',
          color: '#f87171',
        }}>
          {publishError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #1877F2, #0d47a1)',
            color: '#fff', border: 'none', cursor: isPublishing ? 'not-allowed' : 'pointer',
            opacity: isPublishing ? 0.6 : 1,
          }}
        >
          {isPublishing ? 'Publicando en Meta...' : '🚀 Publicar campaña en Meta'}
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            {savingDraft ? 'Guardando...' : '💾 Guardar borrador'}
          </button>
          <button
            onClick={onAdjust}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'transparent',
              border: '1px solid var(--ds-card-border)',
              color: 'var(--ds-text-secondary)', cursor: 'pointer',
            }}
          >
            ← Ajustar
          </button>
        </div>
      </div>
    </div>
  )
}
