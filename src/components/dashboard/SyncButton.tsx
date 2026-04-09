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
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn-ghost"
        style={{
          padding: '7px 12px',
          fontSize: 12,
          minHeight: 34,
          gap: 6,
          cursor: syncing ? 'wait' : 'pointer',
        }}
      >
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} style={{ color: 'var(--ds-color-primary)' }} />
        {syncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn-ghost"
        style={{
          padding: '10px 18px',
          fontSize: 13,
          cursor: syncing ? 'wait' : 'pointer',
        }}
      >
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} style={{ color: 'var(--ds-color-primary)' }} />
        {syncing ? 'Sincronizando métricas...' : 'Sincronizar ahora'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>
        Última sync: {formatRelative(lastSync)}
      </p>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '12px 18px', borderRadius: 12,
          background: 'rgba(8, 10, 22, 0.90)',
          border: `1px solid ${toast.type === 'success' ? 'var(--ds-color-success-border)' : toast.type === 'partial' ? 'var(--ds-color-warning-border)' : 'var(--ds-color-danger-border)'}`,
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.05)',
          color: 'var(--ds-text-primary)', fontSize: 13, fontWeight: 600,
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
