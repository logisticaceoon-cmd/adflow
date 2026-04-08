'use client'

import { useState } from 'react'

interface Props {
  initialConnected: boolean
  accountName: string | null
}

export default function FacebookConnectButton({ initialConnected, accountName }: Props) {
  const [connected, setConnected] = useState(initialConnected)
  const [currentName] = useState(accountName)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/facebook/disconnect', { method: 'POST' })
      if (res.ok) setConnected(false)
    } finally {
      setDisconnecting(false)
    }
  }

  if (connected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
               style={{ background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.25)' }}>
            📣
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--ds-text-secondary)' }}>
              Facebook Ads conectado
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--ds-color-success)' }}>
              ● {currentName || 'Cuenta conectada'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--ds-color-danger-border)',
            color: 'var(--ds-color-danger)',
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
             style={{ background: 'transparent', border: '1px solid transparent' }}>
          📣
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--ds-text-secondary)' }}>
            Facebook Ads
          </p>
          <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
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
