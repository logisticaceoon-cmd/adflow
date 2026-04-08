'use client'
// src/components/dashboard/CampaignPublishFlow.tsx
import { useState } from 'react'
import { ExternalLink, Loader2, CheckCircle2, AlertCircle, Rocket } from 'lucide-react'

interface PublishSummary {
  campaign_name:    string
  ad_sets_created:  number
  ads_created:      number
  total_budget_day: string
  targeting:        string
  status:           string
  meta_url:         string
}

interface Props {
  campaignId: string
  isAlreadyPublished: boolean
  metaCampaignId: string | null
}

type PublishState = 'idle' | 'saving' | 'creating_campaign' | 'creating_adsets' | 'creating_ads' | 'done' | 'error'

const PROGRESS_STEPS = [
  { key: 'saving',            label: 'Guardando campaña...' },
  { key: 'creating_campaign', label: 'Creando campaña en Meta...' },
  { key: 'creating_adsets',   label: 'Creando conjuntos de anuncios...' },
  { key: 'creating_ads',      label: 'Creando anuncios...' },
  { key: 'done',              label: '¡Publicado exitosamente!' },
]

export default function CampaignPublishFlow({ campaignId, isAlreadyPublished, metaCampaignId: initialMetaId }: Props) {
  const [state, setState]               = useState<PublishState>('idle')
  const [error, setError]               = useState('')
  const [partialErrors, setPartialErrors] = useState<string[]>([])
  const [metaId, setMetaId]             = useState(initialMetaId || '')
  const [summary, setSummary]           = useState<PublishSummary | null>(null)

  const currentStepIdx = PROGRESS_STEPS.findIndex(s => s.key === state)

  async function handlePublish() {
    setError('')
    setPartialErrors([])
    setState('saving')

    // Simulate progress steps with delays (real work happens in the API)
    const progressTimer = setTimeout(() => setState('creating_campaign'), 800)
    const progressTimer2 = setTimeout(() => setState('creating_adsets'), 2500)
    const progressTimer3 = setTimeout(() => setState('creating_ads'), 4500)

    try {
      const res = await fetch('/api/facebook/publish-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId }),
      })

      clearTimeout(progressTimer)
      clearTimeout(progressTimer2)
      clearTimeout(progressTimer3)

      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setError(data.error || 'Error al publicar en Meta Ads')
        return
      }

      setMetaId(data.meta_campaign_id || '')
      if (data.partial_errors?.length) setPartialErrors(data.partial_errors)
      if (data.summary) setSummary(data.summary)
      setState('done')
    } catch (err: any) {
      clearTimeout(progressTimer)
      clearTimeout(progressTimer2)
      clearTimeout(progressTimer3)
      setState('error')
      setError(err.message || 'Error de conexión')
    }
  }

  // ── Already published state ───────────────────────────────────────────────
  if (isAlreadyPublished && state === 'idle') {
    return (
      <div className="flex items-center gap-3">
        {initialMetaId && (
          <a
            href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${initialMetaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--ds-card-border)', border: '1px solid var(--ds-card-border)', color: 'var(--ds-color-primary)' }}
          >
            <ExternalLink size={14} /> Ver en Ads Manager
          </a>
        )}
        <button
          onClick={handlePublish}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--ds-color-primary-soft)', border: '1px solid var(--ds-color-primary-border)', color: 'var(--ds-color-primary)' }}
        >
          <Rocket size={14} /> Re-publicar
        </button>
      </div>
    )
  }

  // ── Idle state ────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <button
        onClick={handlePublish}
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'var(--ds-color-primary)',
          color: '#fff',
          boxShadow: '0 4px 20px var(--ds-color-primary-border)',
        }}
      >
        <Rocket size={15} />
        Publicar en Meta
      </button>
    )
  }

  // ── Progress state ────────────────────────────────────────────────────────
  if (state !== 'done' && state !== 'error') {
    return (
      <div
        className="p-5 rounded-2xl"
        style={{ background: 'var(--ds-color-primary-soft)', border: '1px solid var(--ds-color-primary-soft)' }}
      >
        <div className="space-y-3">
          {PROGRESS_STEPS.filter(s => s.key !== 'done').map((s, idx) => {
            const stepIdx = PROGRESS_STEPS.findIndex(x => x.key === state)
            const done = idx < stepIdx
            const active = idx === stepIdx
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {done
                    ? <CheckCircle2 size={16} style={{ color: 'var(--ds-color-primary)' }} />
                    : active
                      ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--ds-color-primary)' }} />
                      : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.15)' }} />
                  }
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: done ? '#8892b0' : active ? '#ffffff' : '#8892b0',
                    fontWeight: active ? 600 : 400,
                    textDecoration: done ? 'none' : undefined,
                  }}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="space-y-3">
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'var(--ds-color-danger-soft)', border: '1px solid var(--ds-color-danger-border)' }}
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Error al publicar en Meta</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(248,113,113,0.80)' }}>{error}</p>
          </div>
        </div>
        <button
          onClick={() => { setState('idle'); setError('') }}
          className="text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Success header */}
      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'transparent', border: '1px solid var(--ds-card-border)' }}
      >
        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ds-color-primary)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ds-color-primary)' }}>¡Campaña publicada en Meta!</p>
          <p className="text-xs mt-1" style={{ color: 'transparent' }}>
            Creada en estado PAUSADA. Activala desde Ads Manager cuando estés listo para invertir.
          </p>
        </div>
      </div>

      {/* Publish summary */}
      {summary && (
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#8892b0', letterSpacing: '0.10em' }}>
            Resumen de publicación
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              { label: 'Ad sets creados',  value: String(summary.ad_sets_created) },
              { label: 'Anuncios creados', value: String(summary.ads_created) },
              { label: 'Presupuesto diario', value: summary.total_budget_day },
              { label: 'Targeting',        value: summary.targeting },
              { label: 'Estado',           value: 'PAUSADA' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#8892b0' }}>{label}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partial errors (warnings) */}
      {partialErrors.length > 0 && (
        <div
          className="p-3 rounded-xl"
          style={{ background: 'var(--ds-color-warning-soft)', border: '1px solid var(--ds-color-warning-border)' }}
        >
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--ds-color-warning)' }}>
            ⚠ Algunos elementos no se crearon:
          </p>
          {partialErrors.map((e, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'rgba(245,158,11,0.80)' }}>• {e}</p>
          ))}
        </div>
      )}

      {/* Ads Manager link */}
      {metaId && (
        <a
          href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 w-full justify-center"
          style={{
            background: 'linear-gradient(135deg, #1877F2, #0d5cc7)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(24,119,242,0.30)',
          }}
        >
          <ExternalLink size={14} />
          Ver campaña en Ads Manager ↗
        </a>
      )}
    </div>
  )
}
