'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Loader2 } from 'lucide-react'

interface Props {
  campaignId:     string
  metaCampaignId: string | null
  currentStatus:  string
}

export default function CampaignActivateButton({ campaignId, metaCampaignId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!metaCampaignId) return null

  const isActive = currentStatus === 'active'
  const action   = isActive ? 'pause' : 'activate'
  const label    = isActive ? 'Pausar campaña' : 'Activar campaña'
  const Icon     = isActive ? Pause : Play

  async function toggle() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/facebook/activate-campaign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campaign_id: campaignId, action }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Error'); return }
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className="btn-ghost text-xs py-2 px-3 gap-1.5"
        style={isActive ? { borderColor: 'rgba(245,158,11,0.4)', color: 'var(--ds-color-warning)' } : { borderColor: 'rgba(45, 212, 191,0.4)', color: 'var(--ds-color-success)' }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
        {loading ? (isActive ? 'Pausando...' : 'Activando...') : label}
      </button>
      {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
