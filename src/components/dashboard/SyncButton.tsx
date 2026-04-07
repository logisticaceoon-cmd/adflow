'use client'
// src/components/dashboard/SyncButton.tsx
// Manual sync trigger — calls POST /api/sync/metrics and shows an inline toast
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'

interface Props {
  variant?: 'full' | 'compact'
}

function formatRelative(date: string | null): string {
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

export default function SyncButton({ variant = 'full' }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'partial' } | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Load last sync timestamp on mount
  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !active) return
      supabase
        .from('sync_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('sync_type', 'daily_metrics')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data?.completed_at) setLastSync(data.completed_at)
        })
    })
    return () => { active = false }
  }, [])

  async function handleSync() {
    setSyncing(true)
    setToast(null)
    try {
      const res = await fetch('/api/sync/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_preset: 'last_7d' }),
      })
      const data = await res.json()
      const result = data?.result
      if (result?.status === 'success') {
        setToast({
          type: 'success',
          message: `✅ ${result.campaignsSynced} campaña${result.campaignsSynced !== 1 ? 's' : ''} sincronizada${result.campaignsSynced !== 1 ? 's' : ''}`,
        })
      } else if (result?.status === 'partial') {
        setToast({
          type: 'partial',
          message: `⚠️ Sync parcial: ${result.campaignsSynced} ok, ${result.errors?.length || 0} errores`,
        })
      } else {
        setToast({
          type: 'error',
          message: `❌ Sync falló: ${result?.errors?.[0] || 'Error desconocido'}`,
        })
      }
      setLastSync(new Date().toISOString())
      router.refresh()
    } catch (err: any) {
      setToast({ type: 'error', message: `❌ ${err.message || 'Error de red'}` })
    } finally {
      setSyncing(false)
      setTimeout(() => setToast(null), 6000)
    }
  }

  if (variant === 'compact') {
    return (
      <button onClick={handleSync} disabled={syncing}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: syncing ? 'wait' : 'pointer',
        }}>
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button onClick={handleSync} disabled={syncing}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 12,
          background: syncing
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, rgba(234,27,126,0.15), rgba(98,196,176,0.10))',
          border: `1px solid ${syncing ? 'rgba(255,255,255,0.10)' : 'rgba(234,27,126,0.35)'}`,
          boxShadow: syncing ? 'none' : '0 0 20px rgba(234,27,126,0.20)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: syncing ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}>
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} style={{ color: '#f9a8d4' }} />
        {syncing ? 'Sincronizando métricas...' : 'Sincronizar ahora'}
      </button>
      <p style={{ fontSize: 10, color: 'var(--muted)' }}>
        Última sync: {formatRelative(lastSync)}
      </p>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '12px 18px', borderRadius: 12,
          background: 'linear-gradient(160deg, rgba(14,4,9,0.96), rgba(8,2,5,0.98))',
          border: `1px solid ${toast.type === 'success' ? 'rgba(6,214,160,0.40)' : toast.type === 'partial' ? 'rgba(245,158,11,0.40)' : 'rgba(239,68,68,0.40)'}`,
          boxShadow: '0 12px 48px rgba(0,0,0,0.60)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          maxWidth: 360,
          animation: 'slideUp 0.3s ease',
        }}>
          {toast.message}
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
