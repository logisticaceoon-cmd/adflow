'use client'
// src/components/dashboard/CampaignActions.tsx
// Control panel for a single campaign: Activar / Pausar / Escalar / Duplicar
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, Pause, TrendingUp, Copy, AlertCircle } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import ScaleBudgetModal from './ScaleBudgetModal'

interface Props {
  campaignId: string
  campaignName: string
  status: string // 'active' | 'paused' | 'draft' | 'error' | 'completed'
  metaCampaignId?: string | null
  dailyBudget: number
  currency?: string
  lastSync?: string | null
}

type ActionKind = 'activate' | 'pause' | 'duplicate' | null

interface Toast { type: 'success' | 'error' | 'info'; message: string; link?: { href: string; label: string } }

function formatRelative(date: string | null | undefined): string {
  if (!date) return 'nunca'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

export default function CampaignActions({
  campaignId, campaignName, status, metaCampaignId,
  dailyBudget, currency = '$', lastSync,
}: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<ActionKind>(null)
  const [scaleOpen, setScaleOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [loading, setLoading] = useState(false)

  const isPublished = !!metaCampaignId
  const canActivate = isPublished && (status === 'paused' || status === 'draft')
  const canPause    = isPublished && status === 'active'
  const canScale    = isPublished && (status === 'active' || status === 'paused')

  function showToast(t: Toast) {
    setToast(t)
    setTimeout(() => setToast(null), 6000)
  }

  async function executeAction() {
    if (!pending) return
    setLoading(true)
    try {
      if (pending === 'activate' || pending === 'pause') {
        const res = await fetch('/api/facebook/activate-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign_id: campaignId, action: pending }),
        })
        const data = await res.json()
        if (!res.ok) {
          showToast({ type: 'error', message: `❌ ${data.error || 'Error desconocido'}` })
        } else {
          showToast({
            type: 'success',
            message: pending === 'activate' ? '✅ Campaña activada' : '⏸ Campaña pausada',
          })
          router.refresh()
        }
      } else if (pending === 'duplicate') {
        const res = await fetch('/api/facebook/duplicate-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign_id: campaignId }),
        })
        const data = await res.json()
        if (!res.ok) {
          showToast({ type: 'error', message: `❌ ${data.error || 'Error al duplicar'}` })
        } else {
          showToast({
            type: 'success',
            message: '📋 Campaña duplicada como borrador',
            link: { href: `/dashboard/campaigns/${data.new_campaign_id}`, label: 'Ver copia →' },
          })
          router.refresh()
        }
      }
    } catch (err: any) {
      showToast({ type: 'error', message: `❌ ${err.message || 'Error de red'}` })
    } finally {
      setLoading(false)
      setPending(null)
    }
  }

  async function handleScale(pctChange: number) {
    const res = await fetch('/api/facebook/scale-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId, pct_change: pctChange }),
    })
    const data = await res.json()
    if (!res.ok) {
      showToast({ type: 'error', message: `❌ ${data.error || 'Error al escalar'}` })
      return
    }
    const status = data.status as string
    const newB = Number(data.new_budget).toFixed(0)
    if (status === 'success') {
      showToast({ type: 'success', message: `📈 Presupuesto escalado a ${currency}${newB}/día` })
    } else if (status === 'partial') {
      showToast({ type: 'info', message: `⚠️ Escalado parcial: ${data.updated_adsets}/${data.updated_adsets + data.failed_adsets} ad sets actualizados` })
    }
    setScaleOpen(false)
    router.refresh()
  }

  const ActionButton = ({
    label, icon: Icon, onClick, enabled, color, tooltipDisabled,
  }: {
    label: string
    icon: any
    onClick: () => void
    enabled: boolean
    color: { base: string; glow: string; text: string }
    tooltipDisabled?: string
  }) => (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={!enabled ? tooltipDisabled : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 12,
        background: enabled ? `${color.base}15` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${enabled ? color.base + '45' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: 'none',
        color: enabled ? color.text : '#5a6478',
        fontSize: 12.5, fontWeight: 700,
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.50,
        transition: 'all 0.2s',
      }}>
      <Icon size={14} strokeWidth={2} />
      {label}
    </button>
  )

  return (
    <div className="card p-5 mb-5" style={{
      background: 'linear-gradient(160deg, rgba(18,4,10,0.95), rgba(12,3,7,0.98))',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
          ⚙️ Acciones de campaña
        </h3>
      </div>

      {!isPublished && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: 'var(--ds-color-warning-soft)',
          border: '1px solid var(--ds-color-warning-border)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--ds-color-warning)',
        }}>
          <AlertCircle size={14} />
          <span>Publicá esta campaña en Meta primero para habilitar las acciones.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <ActionButton
          label="Activar"
          icon={Play}
          enabled={canActivate}
          onClick={() => setPending('activate')}
          color={{ base: 'var(--ds-color-success)', glow: 'transparent', text: 'var(--ds-color-success)' }}
          tooltipDisabled={
            !isPublished ? 'Publicá primero en Meta'
            : status === 'active' ? 'La campaña ya está activa'
            : 'No se puede activar en este estado'
          }
        />
        <ActionButton
          label="Pausar"
          icon={Pause}
          enabled={canPause}
          onClick={() => setPending('pause')}
          color={{ base: 'var(--ds-color-warning)', glow: 'transparent', text: 'var(--ds-color-warning)' }}
          tooltipDisabled={
            !isPublished ? 'Publicá primero en Meta'
            : status !== 'active' ? 'Solo se pueden pausar campañas activas'
            : undefined
          }
        />
        <ActionButton
          label="Escalar"
          icon={TrendingUp}
          enabled={canScale}
          onClick={() => setScaleOpen(true)}
          color={{ base: 'var(--ds-color-primary)', glow: 'transparent', text: 'var(--ds-color-primary)' }}
          tooltipDisabled={!isPublished ? 'Publicá primero en Meta' : 'Solo campañas publicadas'}
        />
        <ActionButton
          label="Duplicar"
          icon={Copy}
          enabled={true}
          onClick={() => setPending('duplicate')}
          color={{ base: 'var(--ds-color-primary)', glow: 'transparent', text: 'var(--ds-color-primary)' }}
        />
      </div>

      <div className="flex items-center gap-3 mt-4" style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
        <span>Estado:</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: status === 'active' ? 'var(--ds-color-success)' : status === 'paused' ? 'var(--ds-color-warning)' : status === 'error' ? 'var(--ds-color-danger)' : '#a0a8c0',
          fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: status === 'active' ? 'var(--ds-color-success)' : status === 'paused' ? 'var(--ds-color-warning)' : status === 'error' ? 'var(--ds-color-danger)' : '#8892b0',
            boxShadow: status === 'active' ? '0 0 8px rgba(6,214,160,0.60)' : undefined,
          }} />
          {status === 'active' ? 'Activa' : status === 'paused' ? 'Pausada' : status === 'draft' ? 'Borrador' : status}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span>Última sync: <b style={{ color: '#a0a8c0' }}>{formatRelative(lastSync)}</b></span>
      </div>

      {/* ── Confirm modals ── */}
      <ConfirmModal
        open={pending === 'activate'}
        onClose={() => !loading && setPending(null)}
        onConfirm={executeAction}
        title="¿Activar esta campaña?"
        description="Meta va a empezar a gastar tu presupuesto diario y mostrar los anuncios inmediatamente."
        confirmLabel="Activar ahora"
        confirmColor="green"
        loading={loading}
        icon="▶"
      />
      <ConfirmModal
        open={pending === 'pause'}
        onClose={() => !loading && setPending(null)}
        onConfirm={executeAction}
        title="¿Pausar esta campaña?"
        description="Los anuncios dejarán de mostrarse y se detendrá el gasto. Podés reactivarla después."
        confirmLabel="Pausar ahora"
        confirmColor="amber"
        loading={loading}
        icon="⏸"
      />
      <ConfirmModal
        open={pending === 'duplicate'}
        onClose={() => !loading && setPending(null)}
        onConfirm={executeAction}
        title="¿Duplicar esta campaña?"
        description="Se creará una copia como borrador con los mismos copies, audiencias y presupuesto. Después podés editarla y publicarla."
        confirmLabel="Duplicar"
        confirmColor="teal"
        loading={loading}
        icon="📋"
      />

      <ScaleBudgetModal
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        onConfirm={handleScale}
        campaignName={campaignName}
        currentBudget={dailyBudget}
        currency={currency}
      />

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '13px 18px', borderRadius: 12,
          background: 'linear-gradient(160deg, rgba(14,4,9,0.98), rgba(8,2,5,0.99))',
          border: `1px solid ${toast.type === 'success' ? 'var(--ds-color-success-border)' : toast.type === 'error' ? 'var(--ds-color-danger-border)' : 'var(--ds-color-warning-border)'}`,
          boxShadow: '0 12px 48px rgba(0,0,0,0.65)',
          maxWidth: 380,
          animation: 'slideUp 0.3s ease',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: toast.link ? 6 : 0 }}>
            {toast.message}
          </p>
          {toast.link && (
            <Link href={toast.link.href} style={{ fontSize: 11, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
              {toast.link.label}
            </Link>
          )}
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
