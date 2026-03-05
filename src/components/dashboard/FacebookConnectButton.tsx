'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FacebookConnection {
  ad_account_id: string | null
  ad_account_name: string | null
}

export default function FacebookConnectButton() {
  const [connection, setConnection] = useState<FacebookConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    async function fetchConnection() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('facebook_connections')
        .select('ad_account_id, ad_account_name')
        .eq('user_id', user.id)
        .maybeSingle()

      setConnection(data)
      setLoading(false)
    }
    fetchConnection()
  }, [])

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/facebook/disconnect', { method: 'POST' })
      if (res.ok) setConnection(null)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--muted)' }} />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Verificando conexión...</span>
      </div>
    )
  }

  if (connection) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
               style={{ background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.25)' }}>
            📣
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--muted)' }}>
              Facebook Ads conectado
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--accent3)' }}>
              ● {connection.ad_account_name || connection.ad_account_id || 'Cuenta conectada'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--danger)',
          }}
        >
          {disconnecting ? 'Desconectando...' : 'Desconectar'}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
             style={{ background: 'rgba(79,110,247,0.12)', border: '1px solid rgba(79,110,247,0.25)' }}>
          📣
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--muted)' }}>
            Facebook Ads
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Conectá tu cuenta para publicar campañas
          </p>
        </div>
      </div>
      <a
        href="/api/auth/facebook"
        className="text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
        style={{
          background: 'linear-gradient(135deg, #1877f2, #0c5dd6)',
          color: '#fff',
        }}
      >
        Conectar Facebook Ads
      </a>
    </div>
  )
}
