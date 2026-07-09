'use client'
// src/components/campaign/StepDone.tsx — Step 5: ¡Listo! (success screen)
import { ExternalLink } from 'lucide-react'

interface Props {
  publishedOk: boolean
  metaCampaignId: string
  savedCampaignId: string | null
  onViewCampaign: () => void
  onViewAll: () => void
  onCreateAnother: () => void
}

export default function StepDone({
  publishedOk, metaCampaignId, savedCampaignId,
  onViewCampaign, onViewAll, onCreateAnother,
}: Props) {
  return (
    <div className="card" style={{
      padding: 40, textAlign: 'center',
      borderColor: 'var(--ds-color-success-border)',
    }}>
      <div style={{
        width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%',
        background: publishedOk
          ? 'rgba(24,119,242,0.12)'
          : 'var(--ds-bg-elevated)',
        border: `1px solid ${publishedOk ? 'rgba(24,119,242,0.30)' : 'var(--ds-card-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
      }}>
        {publishedOk ? '🚀' : '🎉'}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {publishedOk ? '¡Campaña publicada en Meta!' : '¡Campaña guardada!'}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', marginBottom: 28, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>
        {publishedOk
          ? 'Tu campaña fue creada en Meta Ads en estado PAUSADA. Activala desde Ads Manager cuando estés listo para invertir.'
          : 'Tu campaña fue guardada como borrador. Podés publicarla en Meta Ads desde el detalle de campaña.'
        }
      </p>

      <div className="flex flex-col items-center gap-3">
        {publishedOk && metaCampaignId && (
          <a href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaCampaignId}`}
             target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold w-full max-w-xs justify-center transition-opacity hover:opacity-90"
             style={{ background: '#1877F2', color: '#fff' }}>
            <ExternalLink size={14} /> Ver en Ads Manager ↗
          </a>
        )}
        {savedCampaignId && (
          <button onClick={onViewCampaign}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold w-full max-w-xs justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>
            Ver detalle de campaña →
          </button>
        )}
        <button onClick={onViewAll}
          className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ds-text-secondary)' }}>
          Ver todas mis campañas
        </button>
        <button onClick={onCreateAnother}
          className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--ds-text-secondary)' }}>
          + Crear otra campaña
        </button>
      </div>
    </div>
  )
}
