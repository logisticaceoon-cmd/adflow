'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types'
import { Copy, Rocket, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props { campaign: Campaign }

type PublishState = 'idle' | 'loading' | 'success' | 'error'

export default function CampaignDetailActions({ campaign }: Props) {
  const router = useRouter()
  const [duplicating,       setDuplicating]       = useState(false)
  const [showPublishModal,  setShowPublishModal]   = useState(false)
  const [publishState,      setPublishState]       = useState<PublishState>('idle')
  const [publishError,      setPublishError]       = useState('')
  const [publishErrorCode,  setPublishErrorCode]   = useState('')
  const [metaCampaignId,    setMetaCampaignId]     = useState('')
  const [partialErrors,     setPartialErrors]      = useState<string[]>([])

  async function duplicate() {
    setDuplicating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newCampaign } = await supabase
        .from('campaigns')
        .insert({
          user_id:             user!.id,
          name:                `${campaign.name} (copia)`,
          objective:           campaign.objective,
          daily_budget:        campaign.daily_budget,
          product_description: campaign.product_description,
          product_url:         campaign.product_url,
          target_audience:     campaign.target_audience,
          status:              'draft',
          ai_copies:           campaign.ai_copies,
        })
        .select()
        .single()
      if (newCampaign) router.push(`/dashboard/campaigns/${newCampaign.id}`)
    } finally {
      setDuplicating(false)
    }
  }

  function openPublish() {
    setPublishState('idle')
    setPublishError('')
    setPublishErrorCode('')
    setMetaCampaignId('')
    setPartialErrors([])
    setShowPublishModal(true)
  }

  async function publishToMeta() {
    setPublishState('loading')
    setPublishError('')

    try {
      const res  = await fetch('/api/facebook/publish-campaign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campaign_id: campaign.id }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setPublishError(data.error || 'Error desconocido al publicar')
        setPublishErrorCode(data.code || '')
        setPublishState('error')
        return
      }

      setMetaCampaignId(data.meta_campaign_id || '')
      setPartialErrors(data.partial_errors || [])
      setPublishState('success')
      // Refresh server data so status badge updates
      router.refresh()
    } catch (err: any) {
      setPublishError(err.message || 'Error de red')
      setPublishState('error')
    }
  }

  const alreadyPublished = !!campaign.meta_campaign_id

  return (
    <>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={duplicate} disabled={duplicating}
          className="btn-ghost text-xs py-2 px-3 gap-1.5">
          <Copy size={13} />
          {duplicating ? 'Duplicando...' : 'Duplicar'}
        </button>
        <button onClick={openPublish} className="btn-primary text-xs py-2 px-3 gap-1.5">
          <Rocket size={13} />
          {alreadyPublished ? 'Re-publicar' : 'Publicar en Facebook'}
        </button>
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
               style={{ background: 'rgba(18,4,10,0.97)', border: '1px solid rgba(98,196,176,0.18)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4"
                 style={{ borderBottom: '1px solid rgba(98,196,176,0.10)' }}>
              <h3 className="font-semibold text-[15px]">Publicar en Meta Ads</h3>
              <button onClick={() => setShowPublishModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                style={{ color: 'var(--muted)' }}>
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* ── IDLE: pre-flight info ── */}
              {publishState === 'idle' && (
                <>
                  {alreadyPublished && (
                    <div className="mb-4 p-3 rounded-xl text-xs"
                         style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                      ⚠ Esta campaña ya fue publicada (ID: {campaign.meta_campaign_id}).
                      Publicarla de nuevo creará una nueva campaña en Meta Ads.
                    </div>
                  )}

                  <div className="space-y-3 mb-5">
                    {[
                      { icon: '📋', text: `Campaña: ${campaign.name}` },
                      { icon: '🎯', text: `Objetivo: ${campaign.objective}` },
                      { icon: '💰', text: `Presupuesto: $${campaign.daily_budget}/día` },
                      { icon: '📊', text: 'Estado inicial: Pausada (podés activarla desde Meta Ads Manager)' },
                    ].map(({ icon, text }, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-base flex-shrink-0">{icon}</span>
                        <span style={{ color: 'rgba(255,255,255,0.72)' }}>{text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs mb-5" style={{ color: '#8892b0' }}>
                    Se crearán la campaña, conjuntos de anuncios y creativos en tu cuenta de Meta Ads.
                    Necesitás tener una cuenta publicitaria y página de Facebook configuradas en Configuración.
                  </p>

                  <button onClick={publishToMeta} className="btn-primary w-full justify-center gap-2">
                    <Rocket size={14} />
                    Publicar ahora
                  </button>
                </>
              )}

              {/* ── LOADING ── */}
              {publishState === 'loading' && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                       style={{ background: 'rgba(233,30,140,0.10)', border: '1px solid rgba(233,30,140,0.22)' }}>
                    <Loader2 size={26} className="animate-spin" style={{ color: '#e91e8c' }} />
                  </div>
                  <p className="font-semibold mb-1">Publicando en Meta Ads...</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Creando campaña, conjuntos y anuncios. Esto puede tardar unos segundos.
                  </p>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {publishState === 'success' && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                       style={{ background: 'rgba(6,214,160,0.10)', border: '1px solid rgba(6,214,160,0.25)' }}>
                    <CheckCircle2 size={26} style={{ color: '#06d6a0' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: '#06d6a0' }}>¡Publicada en Meta Ads!</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                    Tu campaña fue creada exitosamente. Está en pausa — activala desde Meta Ads Manager cuando estés listo.
                  </p>

                  {metaCampaignId && (
                    <div className="p-3 rounded-xl text-xs mb-4"
                         style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.15)' }}>
                      <p style={{ color: '#8892b0' }}>Meta Campaign ID</p>
                      <p className="font-mono font-semibold mt-0.5" style={{ color: '#06d6a0' }}>{metaCampaignId}</p>
                    </div>
                  )}

                  {partialErrors.length > 0 && (
                    <div className="p-3 rounded-xl text-xs mb-4 text-left"
                         style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)' }}>
                      <p className="font-semibold mb-1.5" style={{ color: '#f59e0b' }}>
                        ⚠ Algunos anuncios no se pudieron crear:
                      </p>
                      {partialErrors.map((e, i) => (
                        <p key={i} className="text-[11px] mb-0.5" style={{ color: '#8892b0' }}>• {e}</p>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setShowPublishModal(false)} className="btn-primary w-full justify-center">
                    Entendido
                  </button>
                </div>
              )}

              {/* ── ERROR ── */}
              {publishState === 'error' && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                       style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertCircle size={26} style={{ color: '#ef4444' }} />
                  </div>
                  <p className="font-semibold mb-2" style={{ color: '#f87171' }}>Error al publicar</p>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {publishError}
                  </p>

                  {(publishErrorCode === 'NO_AD_ACCOUNT' || publishErrorCode === 'NO_PAGE') && (
                    <a href="/dashboard/settings" onClick={() => setShowPublishModal(false)}
                       className="btn-primary w-full justify-center mb-3 text-sm">
                      Ir a Configuración →
                    </a>
                  )}

                  {publishErrorCode === 'NO_FB_TOKEN' && (
                    <a href="/api/auth/facebook"
                       className="btn-primary w-full justify-center mb-3 text-sm">
                      Conectar Facebook →
                    </a>
                  )}

                  <button onClick={() => setPublishState('idle')}
                    className="btn-ghost w-full justify-center text-sm">
                    ← Intentar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
